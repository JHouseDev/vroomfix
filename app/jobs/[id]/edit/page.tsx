import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditJobPageProps {
  params: {
    id: string
  }
}

export default async function EditJobPage({ params }: EditJobPageProps) {
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) {
    redirect("/auth/login")
  }

  // Check permissions
  const allowedRoles = ["super_admin", "admin", "manager", "accounts"]
  if (!allowedRoles.includes(profile.role?.name || "")) {
    redirect("/dashboard")
  }

  const supabase = createClient()

  // Get job details
  const { data: job } = await supabase
    .from("jobs")
    .select(`
      *,
      client:clients(id, first_name, last_name),
      vehicle:vehicles(id, make, model, year, license_plate),
      assigned_technician:users(id, first_name, last_name)
    `)
    .eq("id", params.id)
    .eq("tenant_id", profile.tenant_id)
    .single()

  if (!job) {
    notFound()
  }

  // Get clients and technicians for dropdowns
  const [{ data: clients }, { data: technicians }, { data: statuses }] = await Promise.all([
    supabase.from("clients").select("id, first_name, last_name").eq("tenant_id", profile.tenant_id).order("first_name"),
    supabase
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
      .order("first_name"),
    supabase.from("job_statuses").select("id, name").order("order_index"),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Job #{job.job_number}</h1>
              <p className="text-gray-600">Update job details and assignment</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form className="space-y-8">
          <input type="hidden" name="job_id" value={job.id} />

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" name="title" defaultValue={job.title} required />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={4} defaultValue={job.description || ""} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue={job.priority || "low"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status_id">Status</Label>
                  <Select name="status_id" defaultValue={job.status_id || "pending"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses?.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="scheduled_date">Scheduled Date</Label>
                <Input
                  id="scheduled_date"
                  name="scheduled_date"
                  type="datetime-local"
                  defaultValue={job.scheduled_date ? new Date(job.scheduled_date).toISOString().slice(0, 16) : ""}
                />
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="assigned_technician_id">Assigned Technician</Label>
                <Select name="assigned_technician_id" defaultValue={job.assigned_technician_id || "unassigned"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {technicians?.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.first_name} {tech.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit">Update Job</Button>
            <Button type="button" variant="outline" asChild>
              <a href={`/jobs/${job.id}`}>Cancel</a>
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
