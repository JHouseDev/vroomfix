import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Eye, Send } from "lucide-react"
import Link from "next/link"

export default async function QuotesPage() {
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) {
    redirect("/auth/login")
  }

  const supabase = createClient()

  // Get quotes
  const { data: quotes } = await supabase
    .from("quotes")
    .select(`
      *,
      job:jobs(
        title,
        client:clients(first_name, last_name),
        vehicle:vehicles(make, model, year, license_plate)
      )
    `)
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false })

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
              <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
              <p className="text-gray-600">Manage quotes and proposals</p>
            </div>
            <Button asChild>
              <Link href="/jobs">
                <Plus className="h-4 w-4 mr-2" />
                Create Quote from Job
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {quotes && quotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotes.map((quote) => (
              <Card key={quote.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{quote.quote_number}</CardTitle>
                      <CardDescription className="mt-1">{quote.title}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(quote.status)} variant="secondary">
                      {quote.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Client and Vehicle Info */}
                  <div className="text-sm">
                    <p className="font-medium">
                      {quote.job.client.first_name} {quote.job.client.last_name}
                    </p>
                    <p className="text-gray-600">
                      {quote.job.vehicle.year} {quote.job.vehicle.make} {quote.job.vehicle.model}
                    </p>
                    <p className="text-gray-600">Job: {quote.job.title}</p>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(quote.total_amount)}</p>
                    {quote.valid_until && (
                      <p className="text-xs text-gray-500">
                        Valid until {new Date(quote.valid_until).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Link href={`/quotes/${quote.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>

                    {quote.status === "draft" && (
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/quotes/${quote.id}/send`}>
                          <Send className="h-4 w-4 mr-1" />
                          Send
                        </Link>
                      </Button>
                    )}

                    {quote.status === "approved" && (
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/quotes/${quote.id}/invoice`}>
                          <FileText className="h-4 w-4 mr-1" />
                          Invoice
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <FileText className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
              <p className="text-gray-600 mb-6">Create quotes from jobs to send proposals to clients.</p>
              <Button asChild>
                <Link href="/jobs">View Jobs</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
