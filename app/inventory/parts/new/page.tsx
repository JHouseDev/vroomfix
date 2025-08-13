import { createServerComponentClient } from "@/lib/supabase/server"
import { CreatePartForm } from "@/components/inventory/create-part-form"
import { redirect } from "next/navigation"

export default async function NewPartPage() {
  const supabase = createServerComponentClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get user's tenant
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Check permissions
  if (!["super_admin", "admin", "manager", "accounts"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Fetch suppliers
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("tenant_id", profile.tenant_id)
    .order("name")

  return <CreatePartForm suppliers={suppliers || []} />
}
