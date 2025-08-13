import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Send } from "lucide-react"
import Link from "next/link"

interface QuoteDetailPageProps {
  params: {
    id: string
  }
}

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) {
    redirect("/auth/login")
  }

  const supabase = createClient()

  // Get quote details with all related data
  const { data: quote } = await supabase
    .from("quotes")
    .select(`
      *,
      job:jobs(
        id, title, job_number,
        client:clients(first_name, last_name, email, phone),
        vehicle:vehicles(make, model, year, license_plate)
      ),
      quote_items(*)
    `)
    .eq("id", params.id)
    .eq("tenant_id", profile.tenant_id)
    .single()

  if (!quote) {
    notFound()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "expired":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quote {quote.quote_number}</h1>
              <p className="text-gray-600">{quote.title}</p>
            </div>
            <div className="flex gap-3">
              {quote.status === "draft" && (
                <Button asChild>
                  <Link href={`/quotes/${quote.id}/send`}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Quote
                  </Link>
                </Button>
              )}
              {quote.status === "approved" && (
                <Button asChild>
                  <Link href={`/invoices/new?quote_id=${quote.id}`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Quote Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Quote Details</CardTitle>
                  <Badge className={getStatusColor(quote.status)} variant="secondary">
                    {quote.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Created</span>
                    <p className="text-sm text-gray-900">{new Date(quote.created_at).toLocaleDateString()}</p>
                  </div>
                  {quote.valid_until && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Valid Until</span>
                      <p className="text-sm text-gray-900">{new Date(quote.valid_until).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                {quote.notes && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Notes</span>
                    <p className="text-sm text-gray-700 mt-1">{quote.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quote Items */}
            <Card>
              <CardHeader>
                <CardTitle>Quote Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quote.quote_items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.total_price)}</p>
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(quote.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Information */}
            <Card>
              <CardHeader>
                <CardTitle>Related Job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">
                    <Link href={`/jobs/${quote.job.id}`} className="hover:text-blue-600">
                      {quote.job.title}
                    </Link>
                  </p>
                  <p className="text-sm text-gray-600">Job #{quote.job.job_number}</p>
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {quote.job.client.first_name} {quote.job.client.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{quote.job.client.email}</p>
                  {quote.job.client.phone && <p className="text-sm text-gray-600">{quote.job.client.phone}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle>Vehicle</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-gray-900">
                  {quote.job.vehicle.year} {quote.job.vehicle.make} {quote.job.vehicle.model}
                </p>
                <p className="text-sm text-gray-600">{quote.job.vehicle.license_plate}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
