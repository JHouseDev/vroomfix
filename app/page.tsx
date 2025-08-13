import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench, Users, Calendar, BarChart3 } from "lucide-react"
import Link from "next/link"

export default async function HomePage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Wrench className="h-8 w-8 text-white" />
              </div>
              <h1 className="ml-3 text-2xl font-bold text-gray-900">FleetService Pro</h1>
            </div>
            <div className="flex gap-4">
              <Button asChild variant="outline">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-6xl">Complete Fleet Service Management</h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline your repair shop operations with our comprehensive job management, quoting, invoicing, and client
            portal system. Built for mechanics, by mechanics.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button asChild size="lg" className="text-lg px-8 py-3">
              <Link href="/auth/sign-up">Start Free Trial</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3 bg-transparent">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-24">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-900">Everything You Need</h3>
            <p className="mt-4 text-lg text-gray-600">
              Powerful features designed specifically for fleet service operations
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <div className="bg-blue-100 p-3 rounded-lg w-fit">
                  <Wrench className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Job Management</CardTitle>
                <CardDescription>Complete workflow from request to completion with status tracking</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="bg-green-100 p-3 rounded-lg w-fit">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Client Portal</CardTitle>
                <CardDescription>Let clients track jobs, approve quotes, and manage their fleet</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="bg-purple-100 p-3 rounded-lg w-fit">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Scheduling</CardTitle>
                <CardDescription>Advanced calendar system for job scheduling and resource planning</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="bg-orange-100 p-3 rounded-lg w-fit">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Reporting</CardTitle>
                <CardDescription>Comprehensive reports on revenue, productivity, and performance</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Workflow Section */}
        <div className="mt-24">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-900">Streamlined Workflow</h3>
            <p className="mt-4 text-lg text-gray-600">From job request to payment - everything flows seamlessly</p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              "Job Request",
              "Quote Creation",
              "Quote Approval",
              "Work Authorization",
              "Parts Ordering",
              "Job Completion",
              "Vehicle Collection",
              "Invoice & Payment",
            ].map((step, index) => (
              <div key={step} className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 text-sm font-semibold">
                  {index + 1}
                </div>
                <p className="text-sm font-medium text-gray-900">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
