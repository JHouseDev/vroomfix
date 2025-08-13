import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Car, Phone, Mail, MapPin } from "lucide-react"
import Link from "next/link"

interface JobDetailPageProps {
  params: {
    id: string
  }
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) {
    redirect("/auth/login")
  }

  const supabase = createClient()

  // Get job details with all related data
  const { data: job } = await supabase
    .from("jobs")
    .select(`
      *,
      status:job_statuses(name, color),
      client:clients(
        id, first_name, last_name, email, phone, 
        address_line1, address_line2, city, state, postal_code
      ),
      vehicle:vehicles(id, make, model, year, license_plate, vin),
      assigned_technician:users(id, first_name, last_name, email),
      created_by:users!jobs_created_by_fkey(first_name, last_name)
    `)
    .eq("id", params.id)
    .eq("tenant_id", profile.tenant_id)
    .single()

  if (!job) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job #{job.job_number}</h1>
              <p className="text-gray-600">{job.title}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href={`/jobs/${job.id}/edit`}>Edit Job</Link>
              </Button>
              <Button asChild>
                <Link href={`/quotes/new?job_id=${job.id}`}>Create Quote</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Job Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Job Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <Badge style={{ backgroundColor: job.status?.color || "#6b7280" }} className="text-white">
                    {job.status?.name || "Unknown"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Priority</span>
                  <Badge
                    variant={
                      job.priority === "urgent" ? "destructive" : job.priority === "high" ? "default" : "secondary"
                    }
                  >
                    {job.priority}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Created</span>
                  <span className="text-sm text-gray-900">{new Date(job.created_at).toLocaleDateString()}</span>
                </div>
                {job.scheduled_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Scheduled</span>
                    <span className="text-sm text-gray-900">{new Date(job.scheduled_date).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{job.description || "No description provided."}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {job.client?.first_name} {job.client?.last_name}
                  </p>
                </div>
                {job.client?.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${job.client.email}`} className="hover:text-blue-600">
                      {job.client.email}
                    </a>
                  </div>
                )}
                {job.client?.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${job.client.phone}`} className="hover:text-blue-600">
                      {job.client.phone}
                    </a>
                  </div>
                )}
                {job.client?.address_line1 && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <div>
                      <p>{job.client.address_line1}</p>
                      {job.client.address_line2 && <p>{job.client.address_line2}</p>}
                      <p>
                        {job.client.city}, {job.client.state} {job.client.postal_code}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {job.vehicle?.year} {job.vehicle?.make} {job.vehicle?.model}
                  </p>
                </div>
                {job.vehicle?.license_plate && (
                  <div>
                    <span className="text-sm text-gray-500">License Plate: </span>
                    <span className="text-sm font-medium">{job.vehicle.license_plate}</span>
                  </div>
                )}
                {job.vehicle?.vin && (
                  <div>
                    <span className="text-sm text-gray-500">VIN: </span>
                    <span className="text-sm font-mono">{job.vehicle.vin}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Assigned to: </span>
                  <span className="text-sm font-medium">
                    {job.assigned_technician
                      ? `${job.assigned_technician.first_name} ${job.assigned_technician.last_name}`
                      : "Unassigned"}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Created by: </span>
                  <span className="text-sm font-medium">
                    {job.created_by?.first_name} {job.created_by?.last_name}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
