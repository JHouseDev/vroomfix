import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AuthCallback() {
  const supabase = createClient()

  // The middleware handles the code exchange, so we just redirect
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  } else {
    redirect("/auth/login")
  }
}
