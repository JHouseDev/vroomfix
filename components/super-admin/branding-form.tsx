"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Palette } from "lucide-react"
import { updateTenantBranding } from "@/lib/super-admin/actions"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Updating...
        </>
      ) : (
        "Update Branding"
      )}
    </Button>
  )
}

interface BrandingFormProps {
  tenantId: string
  branding?: {
    primary_color: string
    secondary_color?: string
    logo_url?: string
    company_name: string
    custom_domain?: string
  }
}

export function BrandingForm({ tenantId, branding }: BrandingFormProps) {
  const updateBrandingWithId = updateTenantBranding.bind(null, tenantId)
  const [state, formAction] = useActionState(updateBrandingWithId, null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Palette className="h-5 w-5 mr-2" />
          White-label Branding
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{state.error}</div>
          )}

          {state?.success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              Branding updated successfully!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                name="company_name"
                defaultValue={branding?.company_name}
                placeholder="Your Company Name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_domain">Custom Domain</Label>
              <Input
                id="custom_domain"
                name="custom_domain"
                defaultValue={branding?.custom_domain}
                placeholder="app.yourcompany.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color *</Label>
              <div className="flex space-x-2">
                <Input
                  id="primary_color"
                  name="primary_color"
                  type="color"
                  defaultValue={branding?.primary_color || "#3b82f6"}
                  className="w-16 h-10 p-1"
                  required
                />
                <Input
                  defaultValue={branding?.primary_color || "#3b82f6"}
                  placeholder="#3b82f6"
                  className="flex-1"
                  onChange={(e) => {
                    const colorInput = document.getElementById("primary_color") as HTMLInputElement
                    if (colorInput) colorInput.value = e.target.value
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="secondary_color"
                  name="secondary_color"
                  type="color"
                  defaultValue={branding?.secondary_color || "#6b7280"}
                  className="w-16 h-10 p-1"
                />
                <Input
                  defaultValue={branding?.secondary_color || "#6b7280"}
                  placeholder="#6b7280"
                  className="flex-1"
                  onChange={(e) => {
                    const colorInput = document.getElementById("secondary_color") as HTMLInputElement
                    if (colorInput) colorInput.value = e.target.value
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              name="logo_url"
              type="url"
              defaultValue={branding?.logo_url}
              placeholder="https://yourcompany.com/logo.png"
            />
            <p className="text-sm text-gray-600">Upload your logo to a CDN and paste the URL here</p>
          </div>

          <div className="flex justify-end">
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
