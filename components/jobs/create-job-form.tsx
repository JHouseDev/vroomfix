"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { createJob } from "@/lib/jobs/actions"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating job...
        </>
      ) : (
        "Create Job"
      )}
    </Button>
  )
}

interface CreateJobFormProps {
  clients: Array<{
    id: string
    first_name: string
    last_name: string
    vehicles: Array<{
      id: string
      make: string
      model: string
      year?: number
      license_plate?: string
    }>
  }>
}

export default function CreateJobForm({ clients }: CreateJobFormProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(createJob, null)

  useEffect(() => {
    if (state?.success) {
      router.push(`/jobs/${state.jobId}`)
    }
  }, [state, router])

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Job</CardTitle>
        <CardDescription>Create a new service job for a client's vehicle</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {state.error}
            </div>
          )}

          {/* Client Selection */}
          <div className="space-y-2">
            <label htmlFor="clientId" className="text-sm font-medium">
              Client *
            </label>
            <Select name="clientId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vehicle Selection */}
          <div className="space-y-2">
            <label htmlFor="vehicleId" className="text-sm font-medium">
              Vehicle *
            </label>
            <Select name="vehicleId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {clients.flatMap((client) =>
                  client.vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                      {vehicle.license_plate && ` (${vehicle.license_plate})`}
                    </SelectItem>
                  )),
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Job Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Job Title *
            </label>
            <Input id="title" name="title" placeholder="e.g., Engine Service, Brake Repair" required />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description *
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the work to be performed..."
              rows={4}
              required
            />
          </div>

          {/* Priority and Estimated Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium">
                Priority
              </label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="estimatedHours" className="text-sm font-medium">
                Estimated Hours
              </label>
              <Input id="estimatedHours" name="estimatedHours" type="number" step="0.5" min="0" placeholder="2.5" />
            </div>
          </div>

          {/* Scheduled Start Date */}
          <div className="space-y-2">
            <label htmlFor="scheduledStartDate" className="text-sm font-medium">
              Scheduled Start Date
            </label>
            <Input id="scheduledStartDate" name="scheduledStartDate" type="datetime-local" />
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
