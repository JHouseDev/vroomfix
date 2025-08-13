import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CreateJobForm from "@/components/jobs/create-job-form"

export default async function NewJobPage() {
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) {
    redirect("/auth/login")
  }

  // Check if user has permission to create jobs
  const allowedRoles = ["super_admin", "admin", "manager", "accounts"]
  if (!allowedRoles.includes(profile.role?.name || "")) {
    redirect("/dashboard")
  }

  const supabase = createClient()

  // Get clients for the form
  const { data: clients } = await supabase
    .from("clients")
    .select("id, first_name, last_name, email, phone")
    .eq("tenant_id", profile.tenant_id)
    .order("first_name")

  // Get technicians for assignment
  const { data: technicians } = await supabase
    .from("users")
    .select("id, first_name, last_name")
    .eq("tenant_id", profile.tenant_id)
    .in(
      "role_id",
      [
        (await supabase.from("roles").select("id").eq("name", "technician").single()).data?.id,
        (await supabase.from("roles").select("id").eq("name", "manager").single()).data?.id,
      ].filter(Boolean),
    )
    .order("first_name")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Job</h1>
              <p className="text-gray-600">Add a new service job to the system</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreateJobForm clients={clients || []} technicians={technicians || []} tenantId={profile.tenant_id} />
      </main>
    </div>
  )
}
