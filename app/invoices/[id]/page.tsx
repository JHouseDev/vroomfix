import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Send, DollarSign } from "lucide-react"
import Link from "next/link"

interface InvoiceDetailPageProps {
  params: {
    id: string
  }
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) {
    redirect("/auth/login")
  }

  const supabase = createClient()

  // Get invoice details
  const { data: invoice } = await supabase
    .from("invoices")
    .select(`
      *,
      client:clients(first_name, last_name, email, phone),
      job:jobs(
        id, title, job_number,
        vehicle:vehicles(make, model, year, license_plate)
      ),
      invoice_items(*)
    `)
    .eq("id", params.id)
    .eq("tenant_id", profile.tenant_id)
    .single()

  if (!invoice) {
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
      case "paid":
        return "bg-green-100 text-green-800"
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status !== "paid"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoice_number}</h1>
              <p className="text-gray-600">{invoice.title}</p>
            </div>
            <div className="flex gap-3">
              {invoice.status === "draft" && (
                <Button asChild>
                  <Link href={`/invoices/${invoice.id}/send`}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invoice
                  </Link>
                </Button>
              )}
              {(invoice.status === "sent" || invoice.status === "partial") && (
                <Button asChild>
                  <Link href={`/invoices/${invoice.id}/payment`}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Payment
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Invoice Details</CardTitle>
                  <Badge className={getStatusColor(isOverdue ? "overdue" : invoice.status)} variant="secondary">
                    {isOverdue ? "overdue" : invoice.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Issue Date</span>
                    <p className="text-sm text-gray-900">{new Date(invoice.issue_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Due Date</span>
                    <p className="text-sm text-gray-900">{new Date(invoice.due_date).toLocaleDateString()}</p>
                  </div>
                  {invoice.paid_date && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Paid Date</span>
                      <p className="text-sm text-gray-900">{new Date(invoice.paid_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoice.invoice_items?.map((item, index) => (
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

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Subtotal</span>
                      <span>{formatCurrency(invoice.subtotal_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tax</span>
                      <span>{formatCurrency(invoice.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(invoice.total_amount)}</span>
                    </div>
                    {invoice.amount_paid > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span>Amount Paid</span>
                        <span>{formatCurrency(invoice.amount_paid)}</span>
                      </div>
                    )}
                    {invoice.amount_due > 0 && (
                      <div className="flex justify-between items-center text-red-600 font-medium">
                        <span>Amount Due</span>
                        <span>{formatCurrency(invoice.amount_due)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {invoice.client.first_name} {invoice.client.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{invoice.client.email}</p>
                  {invoice.client.phone && <p className="text-sm text-gray-600">{invoice.client.phone}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Job Information */}
            {invoice.job && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Job</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      <Link href={`/jobs/${invoice.job.id}`} className="hover:text-blue-600">
                        {invoice.job.title}
                      </Link>
                    </p>
                    <p className="text-sm text-gray-600">Job #{invoice.job.job_number}</p>
                    <p className="text-sm text-gray-600">
                      {invoice.job.vehicle.year} {invoice.job.vehicle.make} {invoice.job.vehicle.model}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
