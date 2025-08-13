"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { createQuote } from "@/lib/quotes/actions"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating quote...
        </>
      ) : (
        "Create Quote"
      )}
    </Button>
  )
}

interface CreateQuoteFormProps {
  jobId: string
  jobTitle: string
}

export default function CreateQuoteForm({ jobId, jobTitle }: CreateQuoteFormProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(createQuote, null)

  useEffect(() => {
    if (state?.success) {
      router.push(`/quotes/${state.quoteId}`)
    }
  }, [state, router])

  // Calculate default valid until date (30 days from now)
  const defaultValidUntil = new Date()
  defaultValidUntil.setDate(defaultValidUntil.getDate() + 30)
  const validUntilString = defaultValidUntil.toISOString().split("T")[0]

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Quote</CardTitle>
        <CardDescription>Create a quote for: {jobTitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="jobId" value={jobId} />

          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {state.error}
            </div>
          )}

          {/* Quote Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Quote Title *
            </label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Engine Service Quote"
              defaultValue={`Quote for ${jobTitle}`}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief description of the work to be quoted..."
              rows={3}
            />
          </div>

          {/* Valid Until */}
          <div className="space-y-2">
            <label htmlFor="validUntil" className="text-sm font-medium">
              Valid Until
            </label>
            <Input id="validUntil" name="validUntil" type="date" defaultValue={validUntilString} />
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-2">
            <label htmlFor="termsAndConditions" className="text-sm font-medium">
              Terms and Conditions
            </label>
            <Textarea
              id="termsAndConditions"
              name="termsAndConditions"
              placeholder="Payment terms, warranty information, etc..."
              rows={4}
              defaultValue="Payment due within 30 days of invoice date. All work guaranteed for 90 days or 10,000km, whichever comes first."
            />
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
