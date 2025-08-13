import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Receipt, Plus, Eye, Send, DollarSign } from "lucide-react"
import Link from "next/link"

export default async function InvoicesPage() {
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) {
    redirect("/auth/login")
  }

  const supabase = createClient()

  // Get invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      *,
      client:clients(first_name, last_name),
      job:jobs(
        title,
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
      case "paid":
        return "bg-green-100 text-green-800"
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isOverdue = (dueDate: string, status: string) => {
    return status !== "paid" && status !== "cancelled" && new Date(dueDate) < new Date()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
              <p className="text-gray-600">Manage invoices and payments</p>
            </div>
            <Button asChild>
              <Link href="/quotes">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice from Quote
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {invoices && invoices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{invoice.invoice_number}</CardTitle>
                      <CardDescription className="mt-1">{invoice.title}</CardDescription>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge
                        className={getStatusColor(
                          isOverdue(invoice.due_date, invoice.status) ? "overdue" : invoice.status,
                        )}
                        variant="secondary"
                      >
                        {isOverdue(invoice.due_date, invoice.status) ? "overdue" : invoice.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Client and Vehicle Info */}
                  <div className="text-sm">
                    <p className="font-medium">
                      {invoice.client.first_name} {invoice.client.last_name}
                    </p>
                    {invoice.job && (
                      <>
                        <p className="text-gray-600">
                          {invoice.job.vehicle.year} {invoice.job.vehicle.make} {invoice.job.vehicle.model}
                        </p>
                        <p className="text-gray-600">Job: {invoice.job.title}</p>
                      </>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="text-sm text-gray-600">
                    <p>Issued: {new Date(invoice.issue_date).toLocaleDateString()}</p>
                    <p>Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                    {invoice.paid_date && <p>Paid: {new Date(invoice.paid_date).toLocaleDateString()}</p>}
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</p>
                    {invoice.amount_due > 0 && (
                      <p className="text-sm text-red-600">Due: {formatCurrency(invoice.amount_due)}</p>
                    )}
                    {invoice.amount_paid > 0 && (
                      <p className="text-sm text-green-600">Paid: {formatCurrency(invoice.amount_paid)}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Link href={`/invoices/${invoice.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>

                    {invoice.status === "draft" && (
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/invoices/${invoice.id}/send`}>
                          <Send className="h-4 w-4 mr-1" />
                          Send
                        </Link>
                      </Button>
                    )}

                    {(invoice.status === "sent" || invoice.status === "partial") && (
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/invoices/${invoice.id}/payment`}>
                          <DollarSign className="h-4 w-4 mr-1" />
                          Payment
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
                <Receipt className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
              <p className="text-gray-600 mb-6">Create invoices from approved quotes to bill clients.</p>
              <Button asChild>
                <Link href="/quotes">View Quotes</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
