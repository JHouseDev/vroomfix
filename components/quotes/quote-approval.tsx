"use client"

import type React from "react"

import { useState, useRef, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, CheckCircle } from "lucide-react"
import { approveQuote } from "@/lib/quotes/actions"

function ApproveButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Approving quote...
        </>
      ) : (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          Approve Quote
        </>
      )}
    </Button>
  )
}

interface QuoteApprovalProps {
  quote: {
    id: string
    quote_number: string
    title: string
    description?: string
    subtotal: number
    tax_rate: number
    tax_amount: number
    total_amount: number
    valid_until?: string
    terms_and_conditions?: string
    status: string
    client_approved: boolean
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
    job: {
      title: string
      vehicle: {
        make: string
        model: string
        year?: number
        license_plate?: string
      }
    }
    tenant: {
      name: string
      email: string
      phone?: string
      address?: string
    }
  }
}

export default function QuoteApproval({ quote }: QuoteApprovalProps) {
  const [signature, setSignature] = useState("")
  const [isDrawing, setIsDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [state, formAction] = useActionState(approveQuote, null)

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

  // Signature pad functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    const canvas = canvasRef.current
    if (!canvas) return

    // Convert canvas to base64
    const dataURL = canvas.toDataURL()
    setSignature(dataURL)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignature("")
  }

  if (quote.client_approved) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="text-green-600 mb-4">
            <CheckCircle className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quote Approved</h2>
          <p className="text-gray-600">This quote has been approved and work can now begin.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quote Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{quote.quote_number}</CardTitle>
              <CardDescription>{quote.title}</CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {quote.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Service Provider</h3>
              <div className="text-sm text-gray-600">
                <p className="font-medium">{quote.tenant.name}</p>
                <p>{quote.tenant.email}</p>
                {quote.tenant.phone && <p>{quote.tenant.phone}</p>}
                {quote.tenant.address && <p>{quote.tenant.address}</p>}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Vehicle</h3>
              <div className="text-sm text-gray-600">
                <p>
                  {quote.job.vehicle.year} {quote.job.vehicle.make} {quote.job.vehicle.model}
                </p>
                {quote.job.vehicle.license_plate && <p>License: {quote.job.vehicle.license_plate}</p>}
                <p className="mt-2 font-medium">Job: {quote.job.title}</p>
              </div>
            </div>
          </div>

          {quote.description && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600">{quote.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quote Items */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty/Hours</TableHead>
                <TableHead className="text-right">Rate/Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quote.items.map((item) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT ({quote.tax_rate}%):</span>
              <span>{formatCurrency(quote.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(quote.total_amount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      {quote.terms_and_conditions && (
        <Card>
          <CardHeader>
            <CardTitle>Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.terms_and_conditions}</p>
          </CardContent>
        </Card>
      )}

      {/* Quote Approval */}
      <Card>
        <CardHeader>
          <CardTitle>Approve Quote</CardTitle>
          <CardDescription>
            Please review the quote above and provide your digital signature to approve.
            {quote.valid_until && (
              <span className="block mt-1 text-orange-600">
                This quote is valid until {new Date(quote.valid_until).toLocaleDateString()}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <input type="hidden" name="quoteId" value={quote.id} />
            <input type="hidden" name="signature" value={signature} />

            {state?.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {state.error}
              </div>
            )}

            {state?.success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {state.success}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Digital Signature *</label>
              <div className="border rounded-lg p-4 bg-gray-50">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  className="border bg-white rounded cursor-crosshair w-full"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">Sign above to approve this quote</p>
                  <Button type="button" variant="outline" size="sm" onClick={clearSignature}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            <ApproveButton />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
