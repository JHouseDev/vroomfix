"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface JobStatusChartProps {
  data: Array<{
    id: string
    status: string
    created_at: string
    completed_at: string | null
    estimated_completion: string | null
  }>
}

export function JobStatusChart({ data }: JobStatusChartProps) {
  // Group data by status
  const statusCounts = data.reduce(
    (acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    status: status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    count,
    fill: getStatusColor(status),
  }))

  const chartConfig = {
    count: {
      label: "Jobs",
    },
  }

  function getStatusColor(status: string) {
    const colors = {
      pending: "hsl(45, 93%, 47%)",
      in_progress: "hsl(217, 91%, 60%)",
      awaiting_parts: "hsl(25, 95%, 53%)",
      ready_for_collection: "hsl(142, 71%, 45%)",
      completed: "hsl(142, 76%, 36%)",
      collected: "hsl(210, 40%, 98%)",
    }
    return colors[status as keyof typeof colors] || "hsl(210, 40%, 80%)"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="count"
                label={({ status, count }) => `${status}: ${count}`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
