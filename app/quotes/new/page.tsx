import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NewQuotePageProps {
  searchParams: {
    job_id?: string
  }
}

export default async function NewQuotePage({ searchParams }: NewQuotePageProps) {
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) {
    redirect("/auth/login")
  }

  // Check permissions
  const allowedRoles = ["super_admin", "admin", "manager", "accounts"]
  if (!allowedRoles.includes(profile.role?.name || "")) {
    redirect("/dashboard")
  }

  const supabase = createClient()

  // Get job details if job_id is provided
  let job = null
  if (searchParams.job_id) {
    const { data } = await supabase
      .from("jobs")
      .select(`
        *,
        client:clients(first_name, last_name, email),
        vehicle:vehicles(make, model, year, license_plate)
      `)
      .eq("id", searchParams.job_id)
      .eq("tenant_id", profile.tenant_id)
      .single()

    job = data
  }

  // Get all jobs for selection if no job_id provided
  const { data: jobs } = await supabase
    .from("jobs")
    .select(`
      id, title, job_number,
      client:clients(first_name, last_name),
      vehicle:vehicles(make, model, year)
    `)
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Quote</h1>
              <p className="text-gray-600">Generate a new quote for a job</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form className="space-y-8">
          {/* Job Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job ? (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-gray-600">
                    {job.client.first_name} {job.client.last_name} - {job.vehicle.year} {job.vehicle.make}{" "}
                    {job.vehicle.model}
                  </p>
                  <input type="hidden" name="job_id" value={job.id} />
                </div>
              ) : (
                <div>
                  <Label htmlFor="job_id">Select Job</Label>
                  <Select name="job_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a job" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs?.map((jobOption) => (
                        <SelectItem key={jobOption.id} value={jobOption.id}>
                          {jobOption.title} - {jobOption.client.first_name} {jobOption.client.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quote Details */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Quote Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter quote title"
                  defaultValue={job ? `Quote for ${job.title}` : ""}
                  required
                />
              </div>

              <div>
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  name="valid_until"
                  type="date"
                  defaultValue={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Additional notes or terms" rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Quote Items */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Unit Price</div>
                  <div className="col-span-2">Total</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Initial quote item */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-5">
                    <Input name="items[0][description]" placeholder="Item description" required />
                  </div>
                  <div className="col-span-2">
                    <Input name="items[0][quantity]" type="number" min="1" defaultValue="1" required />
                  </div>
                  <div className="col-span-2">
                    <Input name="items[0][unit_price]" type="number" step="0.01" min="0" placeholder="0.00" required />
                  </div>
                  <div className="col-span-2">
                    <Input name="items[0][total]" type="number" step="0.01" min="0" placeholder="0.00" readOnly />
                  </div>
                  <div className="col-span-1">
                    <Button type="button" variant="outline" size="sm">
                      +
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total Amount:</span>
                  <span className="text-2xl font-bold">R 0.00</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" name="action" value="save_draft">
              Save as Draft
            </Button>
            <Button type="submit" name="action" value="save_and_send" variant="outline">
              Save & Send
            </Button>
            <Button type="button" variant="outline" asChild>
              <a href="/quotes">Cancel</a>
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
