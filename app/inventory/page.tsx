import { createServerComponentClient } from "@/lib/supabase/server"
import { PartsList } from "@/components/inventory/parts-list"
import { redirect } from "next/navigation"

export default async function InventoryPage() {
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

  // Fetch parts with supplier information
  const { data: parts } = await supabase
    .from("inventory_parts")
    .select(`
      *,
      supplier:suppliers(name)
    `)
    .eq("tenant_id", profile.tenant_id)
    .order("name")

  return <PartsList parts={parts || []} />
}
