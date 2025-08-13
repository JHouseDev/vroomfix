"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle, AlertCircle } from "lucide-react"

export default function VerifyEmailPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resending, setResending] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [supabase])

  const resendConfirmation = async () => {
    if (!user?.email) return

    setResending(true)
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      alert("Confirmation email sent! Please check your inbox.")
    }
    setResending(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>We've sent a confirmation link to verify your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <>
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Email sent to: <strong>{user.email}</strong>
                  </span>
                </div>
              </div>

              {user.email_confirmed_at ? (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Email verified! You can now sign in.</span>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 text-center">
                    Didn't receive the email? Check your spam folder or click below to resend.
                  </p>

                  <Button
                    onClick={resendConfirmation}
                    disabled={resending}
                    className="w-full bg-transparent"
                    variant="outline"
                  >
                    {resending ? "Sending..." : "Resend Confirmation Email"}
                  </Button>
                </>
              )}
            </>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">No user session found. Please sign up first.</p>
              <Button asChild>
                <a href="/auth/sign-up">Go to Sign Up</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
