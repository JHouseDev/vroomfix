"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Building } from "lucide-react"
import { createTenant } from "@/lib/super-admin/actions"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating Tenant...
        </>
      ) : (
        "Create Tenant"
      )}
    </Button>
  )
}

export function CreateTenantForm() {
  const router = useRouter()
  const [state, formAction] = useActionState(createTenant, null)

  useEffect(() => {
    if (state?.success) {
      router.push("/super-admin/tenants")
    }
  }, [state, router])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Building className="h-8 w-8 mr-3 text-blue-600" />
          Create New Tenant
        </h1>
        <p className="text-gray-600 mt-2">Set up a new tenant with admin user</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tenant Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-6">
              {state?.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{state.error}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input id="name" name="name" placeholder="e.g., ABC Auto Repair" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain *</Label>
                  <div className="flex">
                    <Input id="subdomain" name="subdomain" placeholder="abc-auto" className="rounded-r-none" required />
                    <div className="bg-gray-50 border border-l-0 rounded-r-md px-3 py-2 text-sm text-gray-600">
                      .yourdomain.com
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription_tier">Subscription Tier *</Label>
                <Select name="subscription_tier" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subscription tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic - Up to 5 users, 100 jobs/month</SelectItem>
                    <SelectItem value="professional">Professional - Up to 25 users, 500 jobs/month</SelectItem>
                    <SelectItem value="enterprise">Enterprise - Unlimited users and jobs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Admin User Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="admin_first_name">First Name *</Label>
                    <Input id="admin_first_name" name="admin_first_name" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_last_name">Last Name *</Label>
                    <Input id="admin_last_name" name="admin_last_name" required />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="admin_email">Admin Email *</Label>
                  <Input id="admin_email" name="admin_email" type="email" required />
                  <p className="text-sm text-gray-600">A temporary password will be generated and sent to this email</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
                  Cancel
                </Button>
                <div className="flex-1">
                  <SubmitButton />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
