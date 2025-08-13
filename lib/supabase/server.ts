import { createServerComponentClient as createSupabaseServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { cache } from "react"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

// Create a cached version of the Supabase client for Server Components
export const createServerComponentClient = cache(() => {
  const cookieStore = cookies()

  if (!isSupabaseConfigured) {
    console.warn("Supabase environment variables are not set. Using dummy client.")
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: null, error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
        eq: () => ({
          select: () => Promise.resolve({ data: null, error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }
  }

  return createSupabaseServerComponentClient({ cookies: () => cookieStore })
})

export const createServerActionClient = () => {
  const cookieStore = cookies()

  if (!isSupabaseConfigured) {
    console.warn("Supabase environment variables are not set. Using dummy client.")
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        admin: {
          createUser: () => Promise.resolve({ data: { user: null }, error: null }),
          deleteUser: () => Promise.resolve({ data: null, error: null }),
        },
      },
      from: (table: string) => ({
        select: (columns?: string) => ({
          eq: (column: string, value: any) => ({
            single: () => Promise.resolve({ data: null, error: null }),
            order: () => Promise.resolve({ data: [], error: null }),
          }),
          gte: () => ({ lte: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
          lt: () => Promise.resolve({ data: [], error: null }),
          neq: () => Promise.resolve({ data: [], error: null }),
          not: () => Promise.resolve({ data: [], error: null }),
          in: () => Promise.resolve({ data: [], error: null }),
          match: () => Promise.resolve({ data: [], error: null }),
          order: () => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        insert: (data: any) => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        update: (data: any) => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
        delete: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
        upsert: () => Promise.resolve({ data: null, error: null }),
      }),
    }
  }

  return createSupabaseServerComponentClient({ cookies: () => cookieStore })
}

// Create a cached version of the Supabase client for Server Components (legacy export)
export const createClient = createServerComponentClient

// Get current user with role and tenant information
export const getCurrentUser = cache(async () => {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { user: null, profile: null, error: authError }
  }

  // Get user profile with role and tenant information
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select(`
      *,
      role:roles(*),
      tenant:tenants(*)
    `)
    .eq("id", user.id)
    .single()

  return {
    user,
    profile,
    error: profileError,
  }
})

// Check if user has specific permission
export const hasPermission = (userRole: any, permission: string): boolean => {
  if (!userRole || !userRole.permissions) return false

  // Super admin has all permissions
  if (userRole.permissions.all === true) return true

  // Check specific permission
  return userRole.permissions[permission] === true
}

// Check if user belongs to specific tenant
export const checkTenantAccess = (userProfile: any, tenantId: string): boolean => {
  if (!userProfile) return false

  // Super admin can access all tenants
  if (userProfile.role?.is_system_role) return true

  // Regular users can only access their own tenant
  return userProfile.tenant_id === tenantId
}
