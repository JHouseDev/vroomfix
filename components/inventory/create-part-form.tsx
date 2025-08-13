"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Package } from "lucide-react"
import { createPart } from "@/lib/inventory/actions"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating Part...
        </>
      ) : (
        "Create Part"
      )}
    </Button>
  )
}

interface Supplier {
  id: string
  name: string
}

interface CreatePartFormProps {
  suppliers: Supplier[]
}

export function CreatePartForm({ suppliers }: CreatePartFormProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(createPart, null)

  useEffect(() => {
    if (state?.success) {
      router.push("/inventory")
    }
  }, [state, router])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Package className="h-8 w-8 mr-3 text-blue-600" />
          Add New Part
        </h1>
        <p className="text-gray-600 mt-2">Add a new part to your inventory</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Part Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            {state?.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{state.error}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="part_number">Part Number *</Label>
                <Input id="part_number" name="part_number" placeholder="e.g., BRK-001" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Part Name *</Label>
                <Input id="name" name="name" placeholder="e.g., Brake Pad Set" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Detailed description of the part..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brakes">Brakes</SelectItem>
                    <SelectItem value="engine">Engine</SelectItem>
                    <SelectItem value="transmission">Transmission</SelectItem>
                    <SelectItem value="suspension">Suspension</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="body">Body</SelectItem>
                    <SelectItem value="fluids">Fluids</SelectItem>
                    <SelectItem value="filters">Filters</SelectItem>
                    <SelectItem value="tires">Tires</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select name="condition" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="refurbished">Refurbished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cost_price">Cost Price *</Label>
                <Input
                  id="cost_price"
                  name="cost_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="selling_price">Selling Price *</Label>
                <Input
                  id="selling_price"
                  name="selling_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="current_stock">Current Stock *</Label>
                <Input id="current_stock" name="current_stock" type="number" min="0" placeholder="0" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_stock">Minimum Stock Level *</Label>
                <Input id="minimum_stock" name="minimum_stock" type="number" min="0" placeholder="5" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location">Storage Location</Label>
                <Input id="location" name="location" placeholder="e.g., Shelf A-1, Bay 2" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_id">Supplier</Label>
                <Select name="supplier_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
  )
}
