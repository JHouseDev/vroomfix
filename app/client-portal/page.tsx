import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import ClientDashboard from "@/components/client-portal/client-dashboard"

export default async function ClientPortalPage() {
  const cookieStore = cookies()
  const clientSessionCookie = cookieStore.get("client_session")

  if (!clientSessionCookie) {
    redirect("/client-portal/login")
  }

  const supabase = createClient()

  // Get client data
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientSessionCookie.value)
    .eq("portal_access", true)
    .eq("is_active", true)
    .single()

  if (!client) {
    redirect("/client-portal/login")
  }

  // Get client's jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select(`
      *,
      status:job_statuses(name, color),
      vehicle:vehicles(make, model, year, license_plate)
    `)
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })

  // Get client's quotes
  const { data: quotes } = await supabase
    .from("quotes")
    .select("*")
    .in("job_id", jobs?.map((job) => job.id) || [])
    .order("created_at", { ascending: false })

  // Get client's invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })

  return <ClientDashboard client={client} jobs={jobs || []} quotes={quotes || []} invoices={invoices || []} />
}
