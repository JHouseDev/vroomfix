import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Car, FileText, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

interface ClientDashboardProps {
  client: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
  jobs: Array<{
    id: string
    job_number: string
    title: string
    description: string
    scheduled_start_date?: string
    status: {
      name: string
      color: string
    }
    vehicle: {
      make: string
      model: string
      year?: number
      license_plate?: string
    }
    created_at: string
  }>
  quotes: Array<{
    id: string
    quote_number: string
    title: string
    total_amount: number
    status: string
    valid_until?: string
    client_approved: boolean
  }>
  invoices: Array<{
    id: string
    invoice_number: string
    title: string
    total_amount: number
    amount_due: number
    status: string
    due_date: string
  }>
}

export default function ClientDashboard({ client, jobs, quotes, invoices }: ClientDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "paid":
      case "completed":
        return "bg-green-100 text-green-800"
      case "sent":
      case "in progress":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "overdue":
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  // Calculate stats
  const activeJobs = jobs.filter((job) => !["Completed", "Cancelled", "Paid"].includes(job.status.name))
  const pendingQuotes = quotes.filter((quote) => quote.status === "sent" && !quote.client_approved)
  const overdueInvoices = invoices.filter(
    (invoice) => invoice.status !== "paid" && new Date(invoice.due_date) < new Date(),
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {client.first_name} {client.last_name}
              </h1>
              <p className="text-gray-600">Track your vehicle service jobs and manage quotes</p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p>{client.email}</p>
              {client.phone && <p>{client.phone}</p>}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Car className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{activeJobs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Quotes</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingQuotes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-red-100 p-3 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">{overdueInvoices.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Jobs */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Jobs</h2>
              <Button asChild variant="outline" size="sm">
                <Link href="/client-portal/jobs">View All</Link>
              </Button>
            </div>
            <div className="space-y-4">
              {jobs.slice(0, 5).map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{job.job_number}</h3>
                          <Badge style={{ backgroundColor: job.status.color, color: "white" }} variant="secondary">
                            {job.status.name}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{job.title}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Car className="h-4 w-4" />
                            {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                          </div>
                          {job.scheduled_start_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(job.scheduled_start_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/client-portal/jobs/${job.id}`}>View</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {jobs.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
                    <p className="text-gray-600">Your service jobs will appear here.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Pending Actions */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Pending Actions</h2>
            <div className="space-y-4">
              {/* Pending Quotes */}
              {pendingQuotes.map((quote) => (
                <Card key={quote.id} className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-yellow-600" />
                          <h3 className="font-semibold">Quote Approval Required</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {quote.quote_number}: {quote.title}
                        </p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(quote.total_amount)}</p>
                        {quote.valid_until && (
                          <p className="text-xs text-orange-600 mt-1">
                            Valid until {new Date(quote.valid_until).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/client-portal/quotes/${quote.id}/approve`}>Review & Approve</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Overdue Invoices */}
              {overdueInvoices.map((invoice) => (
                <Card key={invoice.id} className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <h3 className="font-semibold text-red-800">Overdue Invoice</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {invoice.invoice_number}: {invoice.title}
                        </p>
                        <p className="text-lg font-bold text-red-800">{formatCurrency(invoice.amount_due)}</p>
                        <p className="text-xs text-red-600 mt-1">
                          Due: {new Date(invoice.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Button asChild variant="destructive" size="sm">
                        <Link href={`/client-portal/invoices/${invoice.id}`}>Pay Now</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {pendingQuotes.length === 0 && overdueInvoices.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                    <p className="text-gray-600">No pending actions required at this time.</p>
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
