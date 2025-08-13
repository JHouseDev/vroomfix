import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Plus, Wrench } from "lucide-react"
import Link from "next/link"
import JobCard from "@/components/jobs/job-card"

interface SearchParams {
  search?: string
  status?: string
  priority?: string
  assigned?: string
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) {
    redirect("/auth/login")
  }

  const supabase = createClient()

  // Build query based on search params
  let query = supabase
    .from("jobs")
    .select(`
      *,
      status:job_statuses(name, color),
      client:clients(first_name, last_name),
      vehicle:vehicles(make, model, year, license_plate),
      assigned_technician:users(first_name, last_name)
    `)
    .eq("tenant_id", profile.tenant_id)

  // Apply filters
  if (searchParams.search) {
    query = query.or(`title.ilike.%${searchParams.search}%,job_number.ilike.%${searchParams.search}%`)
  }

  if (searchParams.status) {
    const { data: statusData } = await supabase
      .from("job_statuses")
      .select("id")
      .eq("name", searchParams.status)
      .single()

    if (statusData) {
      query = query.eq("status_id", statusData.id)
    }
  }

  if (searchParams.priority) {
    query = query.eq("priority", searchParams.priority)
  }

  if (searchParams.assigned === "me") {
    query = query.eq("assigned_technician_id", user.id)
  } else if (searchParams.assigned && searchParams.assigned !== "all") {
    query = query.eq("assigned_technician_id", searchParams.assigned)
  }

  const { data: jobs } = await query.order("created_at", { ascending: false })

  // Get filter options
  const [{ data: statuses }, { data: technicians }] = await Promise.all([
    supabase.from("job_statuses").select("name").order("order_index"),
    supabase
      .from("users")
      .select("id, first_name, last_name")
      .eq("tenant_id", profile.tenant_id)
      .eq("role_id", (await supabase.from("roles").select("id").eq("name", "technician").single()).data?.id || ""),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
              <p className="text-gray-600">Manage all service jobs</p>
            </div>
            <Button asChild>
              <Link href="/jobs/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Job
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search jobs..."
                  className="pl-10"
                  defaultValue={searchParams.search}
                  name="search"
                />
              </div>

              {/* Status Filter */}
              <Select defaultValue={searchParams.status || "all"} name="status">
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses?.map((status) => (
                    <SelectItem key={status.name} value={status.name}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select defaultValue={searchParams.priority || "all"} name="priority">
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>

              {/* Assigned Filter */}
              <Select defaultValue={searchParams.assigned || "all"} name="assigned">
                <SelectTrigger>
                  <SelectValue placeholder="All Technicians" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technicians</SelectItem>
                  <SelectItem value="me">My Jobs</SelectItem>
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

        {/* Jobs Grid */}
        {jobs && jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} userRole={profile.role?.name} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Wrench className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-6">
                {searchParams.search || searchParams.status || searchParams.priority
                  ? "Try adjusting your filters to see more results."
                  : "Create your first job to get started."}
              </p>
              <Button asChild>
                <Link href="/jobs/new">Create Job</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
