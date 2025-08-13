import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Users, Wrench, AlertCircle } from "lucide-react"
import Link from "next/link"
import JobCard from "@/components/jobs/job-card"

export default async function DashboardPage() {
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) {
    redirect("/auth/login")
  }

  const supabase = createClient()

  // Get dashboard statistics
  const [{ count: totalJobs }, { count: activeJobs }, { count: overdueJobs }, { count: totalClients }] =
    await Promise.all([
      supabase.from("jobs").select("*", { count: "exact", head: true }).eq("tenant_id", profile.tenant_id),
      supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", profile.tenant_id)
        .not("status_id", "in", `(${["Completed", "Cancelled", "Paid"].join(",")})`),
      supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", profile.tenant_id)
        .lt("scheduled_end_date", new Date().toISOString()),
      supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", profile.tenant_id)
        .eq("is_active", true),
    ])

  // Get recent jobs
  const { data: recentJobs } = await supabase
    .from("jobs")
    .select(`
      *,
      status:job_statuses(name, color),
      client:clients(first_name, last_name),
      vehicle:vehicles(make, model, year, license_plate),
      assigned_technician:users(first_name, last_name)
    `)
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false })
    .limit(6)

  // Get jobs assigned to current user (if technician)
  const { data: myJobs } =
    profile.role?.name === "technician"
      ? await supabase
          .from("jobs")
          .select(`
          *,
          status:job_statuses(name, color),
          client:clients(first_name, last_name),
          vehicle:vehicles(make, model, year, license_plate)
        `)
          .eq("tenant_id", profile.tenant_id)
          .eq("assigned_technician_id", user.id)
          .not("status_id", "in", `(${["Completed", "Cancelled", "Paid"].join(",")})`)
          .order("scheduled_start_date", { ascending: true })
          .limit(4)
      : { data: null }

  const stats = [
    {
      title: "Total Jobs",
      value: totalJobs || 0,
      icon: Wrench,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Jobs",
      value: activeJobs || 0,
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Overdue Jobs",
      value: overdueJobs || 0,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Total Clients",
      value: totalClients || 0,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile.first_name}!</h1>
              <p className="text-gray-600">
                {profile.tenant?.name} • {profile.role?.name}
              </p>
            </div>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/jobs/new">Create Job</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/jobs">View All Jobs</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Jobs (for technicians) */}
          {profile.role?.name === "technician" && myJobs && myJobs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">My Jobs</h2>
                <Button asChild variant="outline" size="sm">
                  <Link href="/jobs?assigned=me">View All</Link>
                </Button>
              </div>
              <div className="space-y-4">
                {myJobs.map((job) => (
                  <JobCard key={job.id} job={job} userRole={profile.role?.name} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Jobs */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Jobs</h2>
              <Button asChild variant="outline" size="sm">
                <Link href="/jobs">View All</Link>
              </Button>
            </div>
            <div className="space-y-4">
              {recentJobs?.map((job) => <JobCard key={job.id} job={job} userRole={profile.role?.name} />) || (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">No jobs found. Create your first job to get started.</p>
                    <Button asChild className="mt-4">
                      <Link href="/jobs/new">Create Job</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
