"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Wrench, CheckCircle, AlertTriangle, Clock } from "lucide-react"

interface DashboardMetricsProps {
  metrics: {
    currentMonthRevenue: number
    activeJobsCount: number
    completedJobsCount: number
    overdueJobsCount: number
    overduePaymentsCount: number
  }
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const metricCards = [
    {
      title: "Monthly Revenue",
      value: formatCurrency(metrics.currentMonthRevenue),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Active Jobs",
      value: metrics.activeJobsCount.toString(),
      icon: Wrench,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Completed This Month",
      value: metrics.completedJobsCount.toString(),
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Overdue Jobs",
      value: metrics.overdueJobsCount.toString(),
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Overdue Payments",
      value: metrics.overduePaymentsCount.toString(),
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon
        return (
          <Card key={index}>
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
        )
      })}
    </div>
  )
}
