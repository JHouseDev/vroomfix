"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Sign in action
export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Sign up action for new tenant registration
export async function signUp(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")
  const firstName = formData.get("firstName")
  const lastName = formData.get("lastName")
  const companyName = formData.get("companyName")
  const phone = formData.get("phone")

  if (!email || !password || !firstName || !lastName || !companyName) {
    return { error: "All fields are required" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (authError) {
      return { error: authError.message }
    }

    if (authData.user) {
      // Create tenant
      const tenantSlug = companyName
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")

      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: companyName.toString(),
          slug: tenantSlug,
          email: email.toString(),
          phone: phone?.toString(),
        })
        .select()
        .single()

      if (tenantError) {
        return { error: "Failed to create company account" }
      }

      // Get admin role
      const { data: adminRole } = await supabase.from("roles").select("id").eq("name", "admin").single()

      // Create user profile
      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user.id,
        tenant_id: tenant.id,
        role_id: adminRole?.id,
        email: email.toString(),
        first_name: firstName.toString(),
        last_name: lastName.toString(),
        phone: phone?.toString(),
      })

      if (profileError) {
        return { error: "Failed to create user profile" }
      }
    }

    return { success: "Account created successfully! Please check your email to verify your account." }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Sign out action
export async function signOut() {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  await supabase.auth.signOut()
  redirect("/auth/login")
}

// Invite user action (for admins)
export async function inviteUser(prevState: any, formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  // Get current user to check permissions
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  const { data: currentUserProfile } = await supabase
    .from("users")
    .select("tenant_id, role:roles(*)")
    .eq("id", user.id)
    .single()

  if (!currentUserProfile?.role?.permissions?.user_management) {
    return { error: "Insufficient permissions" }
  }

  const email = formData.get("email")
  const firstName = formData.get("firstName")
  const lastName = formData.get("lastName")
  const roleId = formData.get("roleId")

  if (!email || !firstName || !lastName || !roleId) {
    return { error: "All fields are required" }
  }

  try {
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12)

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toString(),
      password: tempPassword,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (authError) {
      return { error: authError.message }
    }

    if (authData.user) {
      // Create user profile
      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user.id,
        tenant_id: currentUserProfile.tenant_id,
        role_id: roleId.toString(),
        email: email.toString(),
        first_name: firstName.toString(),
        last_name: lastName.toString(),
      })

      if (profileError) {
        return { error: "Failed to create user profile" }
      }
    }

    return { success: "User invited successfully! They will receive an email with login instructions." }
  } catch (error) {
    console.error("Invite user error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
