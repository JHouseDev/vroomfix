"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// Client portal login
export async function clientPortalLogin(prevState: any, formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  try {
    // Find client by email
    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("email", email.toString())
      .eq("portal_access", true)
      .eq("is_active", true)
      .single()

    if (!client) {
      return { error: "Invalid credentials or portal access not enabled" }
    }

    // Verify password (in a real app, you'd use proper password hashing)
    // For now, we'll use a simple comparison
    if (client.portal_password_hash !== password.toString()) {
      return { error: "Invalid credentials" }
    }

    // Set client session (you might want to use a more secure method)
    const response = new Response()
    response.headers.set("Set-Cookie", `client_session=${client.id}; Path=/; HttpOnly; SameSite=Strict`)

    return { success: true, clientId: client.id }
  } catch (error) {
    console.error("Client portal login error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Enable client portal access
export async function enableClientPortalAccess(clientId: string, tempPassword: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { error } = await supabase
      .from("clients")
      .update({
        portal_access: true,
        portal_password_hash: tempPassword, // In production, hash this properly
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId)

    if (error) {
      return { error: "Failed to enable portal access" }
    }

    revalidatePath("/clients")
    revalidatePath(`/clients/${clientId}`)

    return { success: "Portal access enabled successfully" }
  } catch (error) {
    console.error("Enable portal access error:", error)
    return { error: "An unexpected error occurred" }
  }
}
