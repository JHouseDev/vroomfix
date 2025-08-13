"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, User } from "lucide-react"
import { clientPortalLogin } from "@/lib/client-portal/actions"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        "Sign In"
      )}
    </Button>
  )
}

export default function ClientPortalLoginPage() {
  const router = useRouter()
  const [state, formAction] = useActionState(clientPortalLogin, null)

  useEffect(() => {
    if (state?.success) {
      router.push("/client-portal")
    }
  }, [state, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <User className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Client Portal</CardTitle>
          <CardDescription>Sign in to track your vehicle service jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {state.error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input id="email" name="email" type="email" placeholder="your@email.com" required className="w-full" />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input id="password" name="password" type="password" required className="w-full" />
            </div>

            <SubmitButton />

            <div className="text-center text-sm text-gray-600">
              Need access to the client portal?{" "}
              <span className="text-blue-600 font-medium">Contact your service provider</span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
