import { createServerComponentClient } from "@/lib/supabase/server"
import { DashboardMetrics } from "@/components/reports/dashboard-metrics"
import { RevenueChart } from "@/components/reports/revenue-chart"
import { JobStatusChart } from "@/components/reports/job-status-chart"
import { OverdueAlerts } from "@/components/reports/overdue-alerts"
import { getDashboardMetrics, getRevenueData, getJobMetrics, getOverdueData } from "@/lib/reports/actions"
import { redirect } from "next/navigation"

export default async function ReportsPage() {
  const supabase = createServerComponentClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get user's tenant and role
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Check permissions - only admin, manager, and accounts can view reports
  if (!["super_admin", "admin", "manager", "accounts"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Get date range (last 6 months)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 6)

  // Fetch all data
  const [metrics, revenueData, jobData, overdueData] = await Promise.all([
    getDashboardMetrics(profile.tenant_id),
    getRevenueData(profile.tenant_id, startDate.toISOString(), endDate.toISOString()),
    getJobMetrics(profile.tenant_id, startDate.toISOString(), endDate.toISOString()),
    getOverdueData(profile.tenant_id),
  ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">Monitor your business performance and key metrics</p>
      </div>

      {/* Key Metrics */}
      <DashboardMetrics metrics={metrics} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} />
        <JobStatusChart data={jobData} />
      </div>

      {/* Overdue Alerts */}
      <OverdueAlerts overdueJobs={overdueData.overdueJobs} overduePayments={overdueData.overduePayments} />
    </div>
  )
}
