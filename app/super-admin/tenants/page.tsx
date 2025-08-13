import { createServerComponentClient } from "@/lib/supabase/server"
import { TenantList } from "@/components/super-admin/tenant-list"
import { redirect } from "next/navigation"

export default async function TenantsPage() {
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

  // Fetch tenants with metrics
  const { data: tenants } = await supabase
    .from("tenants")
    .select(`
      *,
      user_profiles(count),
      jobs(count),
      invoices(total_amount, status)
    `)
    .order("created_at", { ascending: false })

  // Process tenant data with metrics
  const tenantsWithMetrics =
    tenants?.map((tenant) => ({
      ...tenant,
      user_count: tenant.user_profiles?.length || 0,
      job_count: tenant.jobs?.length || 0,
      revenue:
        tenant.invoices
          ?.filter((invoice: any) => invoice.status === "paid")
          .reduce((sum: number, invoice: any) => sum + invoice.total_amount, 0) || 0,
    })) || []

  return <TenantList tenants={tenantsWithMetrics} />
}
