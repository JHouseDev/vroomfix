import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse, type NextRequest } from "next/server"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

export async function updateSession(request: NextRequest) {
  // If Supabase is not configured, just continue without auth
  if (!isSupabaseConfigured) {
    return NextResponse.next({
      request,
    })
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Check if this is an auth callback
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)
    // Redirect to dashboard after successful auth
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession()

  // Define route access rules
  const isPublicRoute =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/auth/") ||
    request.nextUrl.pathname.startsWith("/client-portal/") ||
    request.nextUrl.pathname.startsWith("/api/public/")

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/auth/login") ||
    request.nextUrl.pathname.startsWith("/auth/sign-up") ||
    request.nextUrl.pathname === "/auth/callback"

  // Protected routes - redirect to login if not authenticated
  if (!isPublicRoute && !isAuthRoute) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      const redirectUrl = new URL("/auth/login", request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Get user profile to check role and tenant access
    const { data: userProfile } = await supabase
      .from("users")
      .select(`
        *,
        role:roles(*),
        tenant:tenants(*)
      `)
      .eq("id", session.user.id)
      .single()

    // Check role-based access for admin routes
    if (request.nextUrl.pathname.startsWith("/admin/")) {
      if (!userProfile?.role?.permissions?.tenant_management) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }

    // Check super admin access
    if (request.nextUrl.pathname.startsWith("/super-admin/")) {
      if (!userProfile?.role?.is_system_role) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }

    // Add user info to headers for use in components
    res.headers.set("x-user-id", session.user.id)
    res.headers.set("x-tenant-id", userProfile?.tenant_id || "")
    res.headers.set("x-user-role", userProfile?.role?.name || "")
  }

  return res
}
