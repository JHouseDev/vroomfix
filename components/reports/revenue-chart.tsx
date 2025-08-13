"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"

interface RevenueChartProps {
  data: Array<{
    id: string
    total_amount: number
    status: string
    created_at: string
    job: {
      id: string
      job_number: string
      client: { name: string }
    }
  }>
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Group data by month
  const monthlyData = data.reduce(
    (acc, invoice) => {
      const date = new Date(invoice.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          revenue: 0,
          count: 0,
        }
      }

      if (invoice.status === "paid") {
        acc[monthKey].revenue += invoice.total_amount
      }
      acc[monthKey].count += 1

      return acc
    },
    {} as Record<string, { month: string; revenue: number; count: number }>,
  )

  const chartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [
                      new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(value as number),
                      "Revenue",
                    ]}
                  />
                }
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
