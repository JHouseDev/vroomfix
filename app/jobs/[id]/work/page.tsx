import { createServerComponentClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import PartsUsageForm from "@/components/jobs/parts-usage-form"
import { Wrench, Clock, User } from "lucide-react"

interface JobWorkPageProps {
  params: {
    id: string
  }
}

export default async function JobWorkPage({ params }: JobWorkPageProps) {
  const supabase = createServerComponentClient()
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) {
    redirect("/auth/login")
  }

  // Check if user has technician access
  if (!["technician", "admin", "manager"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Get job details
  const { data: job } = await supabase
    .from("jobs")
    .select(`
      *,
      client:clients(first_name, last_name, email, phone),
      vehicle:vehicles(make, model, year, license_plate, vin),
      status:job_statuses(name, color),
      assigned_technician:user_profiles!jobs_assigned_technician_id_fkey(first_name, last_name)
    `)
    .eq("id", params.id)
    .eq("tenant_id", profile.tenant_id)
    .single()

  if (!job) {
    redirect("/jobs")
  }

  // Get allocated parts
  const { data: allocatedParts } = await supabase
    .from("job_parts_allocation")
    .select(`
      *,
      part:inventory_parts(
        id,
        part_number,
        name,
        selling_price,
        current_stock,
        condition
      )
    `)
    .eq("job_id", params.id)

  // Get available parts for allocation
  const { data: availableParts } = await supabase
    .from("inventory_parts")
    .select("id, part_number, name, selling_price, current_stock, condition")
    .eq("tenant_id", profile.tenant_id)
    .gt("current_stock", 0)
    .order("name")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Work on Job</h1>
          <p className="text-muted-foreground">Record work progress and parts usage</p>
        </div>
        <Badge style={{ backgroundColor: job.status.color, color: "white" }}>{job.status.name}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{job.job_number}</h3>
                <p className="text-muted-foreground">{job.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Client:</span>
                  <p>
                    {job.client.first_name} {job.client.last_name}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Vehicle:</span>
                  <p>
                    {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                  </p>
                  {job.vehicle.license_plate && <p className="text-muted-foreground">({job.vehicle.license_plate})</p>}
                </div>
              </div>

              <div>
                <span className="font-medium">Description:</span>
                <p className="text-muted-foreground mt-1">{job.description}</p>
              </div>

              {job.assigned_technician && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>
                    Assigned to: {job.assigned_technician.first_name} {job.assigned_technician.last_name}
                  </span>
                </div>
              )}

              {job.estimated_hours && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Estimated: {job.estimated_hours} hours</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parts Usage Form */}
          <PartsUsageForm
            jobId={params.id}
            allocatedParts={allocatedParts || []}
            availableParts={availableParts || []}
          />
        </div>

        {/* Allocated Parts Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Allocated Parts</CardTitle>
            </CardHeader>
            <CardContent>
              {allocatedParts && allocatedParts.length > 0 ? (
                <div className="space-y-3">
                  {allocatedParts.map((allocation: any) => (
                    <div key={allocation.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{allocation.part.name}</p>
                          <p className="text-sm text-muted-foreground">{allocation.part.part_number}</p>
                          <Badge variant="outline" className="mt-1">
                            {allocation.part.condition}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">Allocated: {allocation.quantity_allocated}</p>
                          {allocation.quantity_used && (
                            <p className="text-sm text-green-600">Used: {allocation.quantity_used}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No parts allocated yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
