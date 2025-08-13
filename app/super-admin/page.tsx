import { Button } from "@/components/ui/button"
import { createServerComponentClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Users, DollarSign, BarChart3 } from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function SuperAdminDashboard() {
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

  // Get platform metrics
  const [{ count: totalTenants }, { count: totalUsers }, { data: revenueData }, { count: totalJobs }] =
    await Promise.all([
      supabase.from("tenants").select("*", { count: "exact", head: true }),
      supabase.from("user_profiles").select("*", { count: "exact", head: true }),
      supabase.from("invoices").select("total_amount").eq("status", "paid"),
      supabase.from("jobs").select("*", { count: "exact", head: true }),
    ])

  const totalRevenue = revenueData?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const metrics = [
    {
      title: "Total Tenants",
      value: totalTenants?.toString() || "0",
      icon: Building,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      href: "/super-admin/tenants",
    },
    {
      title: "Total Users",
      value: totalUsers?.toString() || "0",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
      href: "/super-admin/users",
    },
    {
      title: "Platform Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      href: "/super-admin/analytics",
    },
    {
      title: "Total Jobs",
      value: totalJobs?.toString() || "0",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      href: "/super-admin/analytics",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Platform overview and tenant management</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <Link key={index} href={metric.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{metric.title}</CardTitle>
                  <div className={`p-2 rounded-full ${metric.bgColor}`}>
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tenant Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">Manage all tenants, subscriptions, and features</p>
            <div className="space-y-2">
              <Link href="/super-admin/tenants" className="block">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  View All Tenants
                </Button>
              </Link>
              <Link href="/super-admin/tenants/new" className="block">
                <Button className="w-full justify-start">Create New Tenant</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">View cross-tenant analytics and insights</p>
            <div className="space-y-2">
              <Link href="/super-admin/analytics" className="block">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  View Analytics
                </Button>
              </Link>
              <Link href="/super-admin/reports" className="block">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  Generate Reports
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">Configure platform-wide settings and features</p>
            <div className="space-y-2">
              <Link href="/super-admin/settings" className="block">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  Platform Settings
                </Button>
              </Link>
              <Link href="/super-admin/subscription-tiers" className="block">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  Subscription Tiers
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
