"use client"

import { useState, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { addQuoteItem } from "@/lib/quotes/actions"

function AddItemButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adding...
        </>
      ) : (
        <>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </>
      )}
    </Button>
  )
}

interface QuoteLineItemsProps {
  quoteId: string
  items: Array<{
    id: string
    item_type: string
    description: string
    quantity: number
    unit_price: number
    total_price: number
    hours?: number
    hourly_rate?: number
  }>
  parts?: Array<{
    id: string
    name: string
    part_number: string
    selling_price: number
  }>
  canEdit: boolean
}

export default function QuoteLineItems({ quoteId, items, parts = [], canEdit }: QuoteLineItemsProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [itemType, setItemType] = useState("labor")
  const [state, formAction] = useActionState(addQuoteItem, null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount)
  }

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case "labor":
        return "bg-blue-100 text-blue-800"
      case "part":
        return "bg-green-100 text-green-800"
      case "service":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Quote Items</CardTitle>
          {canEdit && (
            <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Item Form */}
        {showAddForm && canEdit && (
          <Card>
            <CardContent className="p-4">
              <form action={formAction} className="space-y-4">
                <input type="hidden" name="quoteId" value={quoteId} />

                {state?.error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                    {state.error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Item Type</label>
                    <Select name="itemType" value={itemType} onValueChange={setItemType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="labor">Labor</SelectItem>
                        <SelectItem value="part">Part</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {itemType === "part" && parts.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Part</label>
                      <Select name="partId">
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a part" />
                        </SelectTrigger>
                        <SelectContent>
                          {parts.map((part) => (
                            <SelectItem key={part.id} value={part.id}>
                              {part.name} ({part.part_number}) - {formatCurrency(part.selling_price)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea name="description" placeholder="Describe the work or item..." required />
                </div>

                {itemType === "labor" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hours</label>
                      <Input name="hours" type="number" step="0.25" min="0" placeholder="2.5" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hourly Rate</label>
                      <Input name="hourlyRate" type="number" step="0.01" min="0" placeholder="150.00" required />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Quantity</label>
                      <Input name="quantity" type="number" step="1" min="1" defaultValue="1" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Unit Price</label>
                      <Input name="unitPrice" type="number" step="0.01" min="0" placeholder="99.99" required />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <AddItemButton />
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Items Table */}
        {items.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty/Hours</TableHead>
                <TableHead className="text-right">Rate/Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                {canEdit && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge className={getItemTypeColor(item.item_type)} variant="secondary">
                      {item.item_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">
                    {item.item_type === "labor" ? `${item.hours}h` : item.quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unit_price)}
                    {item.item_type === "labor" && "/hr"}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.total_price)}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">No items added yet. Click "Add Item" to get started.</div>
        )}
      </CardContent>
    </Card>
  )
}
