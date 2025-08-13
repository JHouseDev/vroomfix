import { createServerComponentClient } from "@/lib/supabase/server"
import { CreateTenantForm } from "@/components/super-admin/create-tenant-form"
import { redirect } from "next/navigation"

export default async function NewTenantPage() {
  const supabase = createServerComponentClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Verify super admin role
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("user_id", user.id).single()

  if (!profile || profile.role !== "super_admin") {
    redirect("/dashboard")
  }

  return <CreateTenantForm />
}
