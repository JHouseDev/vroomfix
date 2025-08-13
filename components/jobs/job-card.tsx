import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, Car } from "lucide-react"
import Link from "next/link"

interface JobCardProps {
  job: {
    id: string
    job_number: string
    title: string
    description: string
    priority: string
    estimated_hours?: number
    actual_hours?: number
    scheduled_start_date?: string
    status: {
      name: string
      color: string
    }
    client: {
      first_name: string
      last_name: string
    }
    vehicle: {
      make: string
      model: string
      year?: number
      license_plate?: string
    }
    assigned_technician?: {
      first_name: string
      last_name: string
    }
    created_at: string
  }
  userRole?: string
}

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

export default function JobCard({ job, userRole }: JobCardProps) {
  const priorityColor = priorityColors[job.priority as keyof typeof priorityColors] || priorityColors.medium

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{job.job_number}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{job.title}</p>
          </div>
          <div className="flex gap-2">
            <Badge className={priorityColor} variant="secondary">
              {job.priority}
            </Badge>
            <Badge style={{ backgroundColor: job.status.color, color: "white" }} variant="secondary">
              {job.status.name}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Client and Vehicle Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>
              {job.client.first_name} {job.client.last_name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span>
              {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
              {job.vehicle.license_plate && ` (${job.vehicle.license_plate})`}
            </span>
          </div>
        </div>

        {/* Time and Technician Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {job.scheduled_start_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(job.scheduled_start_date).toLocaleDateString()}</span>
            </div>
          )}
          {(job.estimated_hours || job.actual_hours) && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{job.actual_hours ? `${job.actual_hours}h actual` : `${job.estimated_hours}h est.`}</span>
            </div>
          )}
        </div>

        {/* Assigned Technician */}
        {job.assigned_technician && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>
              Assigned to: {job.assigned_technician.first_name} {job.assigned_technician.last_name}
            </span>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
            <Link href={`/jobs/${job.id}`}>View Details</Link>
          </Button>
          {(userRole === "technician" || userRole === "admin" || userRole === "manager") && (
            <Button asChild size="sm" className="flex-1">
              <Link href={`/jobs/${job.id}/work`}>Work on Job</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
