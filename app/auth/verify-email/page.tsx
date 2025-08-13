"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, CheckCircle, AlertCircle } from "lucide-react"

export default function VerifyEmailPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resending, setResending] = useState(false)
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      if (user?.email) {
        setEmail(user.email)
      }
      setLoading(false)
    }
    getUser()
  }, [supabase])

  const resendConfirmation = async () => {
    if (!email) {
      setMessage("Please enter your email address")
      return
    }

    setResending(true)
    setMessage("")

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage("Confirmation email sent! Please check your inbox and spam folder.")
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
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            {user ? "We've sent a confirmation link to your email" : "Enter your email to resend the confirmation link"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.email_confirmed_at ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Email verified! You can now sign in.</span>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  disabled={!!user?.email} // Disable if user is authenticated
                />
              </div>

              {user && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Please check your email and click the confirmation link</span>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-600 text-center">
                Didn't receive the email? Check your spam folder or click below to resend.
              </p>

              <Button
                onClick={resendConfirmation}
                disabled={resending || !email}
                className="w-full bg-transparent"
                variant="outline"
              >
                {resending ? "Sending..." : "Resend Confirmation Email"}
              </Button>

              {message && (
                <div
                  className={`px-4 py-3 rounded-md text-sm ${
                    message.includes("Error")
                      ? "bg-red-50 border border-red-200 text-red-700"
                      : "bg-green-50 border border-green-200 text-green-700"
                  }`}
                >
                  {message}
                </div>
              )}
            </>
          )}

          <div className="text-center pt-4">
            <Button asChild variant="ghost">
              <a href="/auth/login" className="text-sm text-gray-600 hover:text-gray-800">
                Back to Login
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
