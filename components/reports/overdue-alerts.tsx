"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, ExternalLink } from "lucide-react"
import Link from "next/link"

interface OverdueAlertsProps {
  overdueJobs: Array<{
    id: string
    job_number: string
    status: string
    estimated_completion: string
    client: { name: string }
    vehicle: { make: string; model: string; registration: string }
  }>
  overduePayments: Array<{
    id: string
    invoice_number: string
    total_amount: number
    due_date: string
    status: string
    job: {
      job_number: string
      client: { name: string }
    }
  }>
}

export function OverdueAlerts({ overdueJobs, overduePayments }: OverdueAlertsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getDaysOverdue = (dateString: string) => {
    const dueDate = new Date(dateString)
    const today = new Date()
    const diffTime = today.getTime() - dueDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Overdue Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-orange-700">
            <Clock className="h-5 w-5 mr-2" />
            Overdue Jobs ({overdueJobs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overdueJobs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No overdue jobs</p>
          ) : (
            <div className="space-y-4">
              {overdueJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{job.job_number}</span>
                      <Badge variant="outline" className="text-orange-700 border-orange-300">
                        {getDaysOverdue(job.estimated_completion)} days overdue
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{job.client.name}</p>
                    <p className="text-sm text-gray-500">
                      {job.vehicle.make} {job.vehicle.model} - {job.vehicle.registration}
                    </p>
                    <p className="text-xs text-gray-500">Due: {formatDate(job.estimated_completion)}</p>
                  </div>
                  <Link href={`/jobs/${job.id}`}>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
              {overdueJobs.length > 5 && (
                <div className="text-center">
                  <Link href="/reports/overdue-jobs">
                    <Button variant="outline" size="sm">
                      View All {overdueJobs.length} Overdue Jobs
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-700">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Overdue Payments ({overduePayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overduePayments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No overdue payments</p>
          ) : (
            <div className="space-y-4">
              {overduePayments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{payment.invoice_number}</span>
                      <Badge variant="outline" className="text-red-700 border-red-300">
                        {getDaysOverdue(payment.due_date)} days overdue
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{payment.job.client.name}</p>
                    <p className="text-sm font-medium text-red-700">{formatCurrency(payment.total_amount)}</p>
                    <p className="text-xs text-gray-500">Due: {formatDate(payment.due_date)}</p>
                  </div>
                  <Link href={`/invoices/${payment.id}`}>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
              {overduePayments.length > 5 && (
                <div className="text-center">
                  <Link href="/reports/overdue-payments">
                    <Button variant="outline" size="sm">
                      View All {overduePayments.length} Overdue Payments
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
