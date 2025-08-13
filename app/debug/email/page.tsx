import { createServerComponentClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

async function testEmailDelivery() {
  "use server"

  const supabase = createServerComponentClient()

  try {
    const { data, error } = await supabase.auth.signUp({
      email: "test@example.com",
      password: "testpassword123",
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    return { data, error: error?.message }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export default async function EmailDebugPage() {
  const supabase = createServerComponentClient()

  // Get current auth settings
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Email Debug Tool</h1>
        <p className="text-muted-foreground">Diagnose email delivery issues with your Supabase configuration</p>
      </div>

      <div className="grid gap-6">
        {/* Environment Variables Check */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Check if required environment variables are set</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>NEXT_PUBLIC_SUPABASE_URL</span>
              <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
              <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>NEXT_PUBLIC_SITE_URL</span>
              <Badge variant={process.env.NEXT_PUBLIC_SITE_URL ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_SITE_URL ? "Set" : "Missing"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL</span>
              <Badge variant={process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ? "Set" : "Missing"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Current Session */}
        <Card>
          <CardHeader>
            <CardTitle>Current Session</CardTitle>
            <CardDescription>Check your current authentication status</CardDescription>
          </CardHeader>
          <CardContent>
            {session ? (
              <div className="space-y-2">
                <p>
                  <strong>User ID:</strong> {session.user.id}
                </p>
                <p>
                  <strong>Email:</strong> {session.user.email}
                </p>
                <p>
                  <strong>Email Confirmed:</strong>
                  <Badge variant={session.user.email_confirmed_at ? "default" : "destructive"} className="ml-2">
                    {session.user.email_confirmed_at ? "Yes" : "No"}
                  </Badge>
                </p>
                {session.user.email_confirmed_at && (
                  <p>
                    <strong>Confirmed At:</strong> {new Date(session.user.email_confirmed_at).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No active session</p>
            )}
          </CardContent>
        </Card>

        {/* Manual Email Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test Email Delivery</CardTitle>
            <CardDescription>Test email delivery with a dummy account (use test@example.com)</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={testEmailDelivery}>
              <Button type="submit" className="w-full">
                Test Email Delivery
              </Button>
            </form>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Common Issues:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Check Supabase Auth settings: Enable email confirmations</li>
                <li>• Configure SMTP settings in Supabase dashboard</li>
                <li>• Check spam/junk folder</li>
                <li>• Verify Site URL and Redirect URLs match your domain</li>
                <li>• Default Supabase email service has daily limits</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Direct links to Supabase dashboard sections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              <strong>Supabase Dashboard:</strong> Go to your project dashboard
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground ml-4">
              <li>• Authentication → Settings → Email Auth</li>
              <li>• Authentication → Settings → SMTP Settings</li>
              <li>• Authentication → Users (check user status)</li>
              <li>• Logs & Reports → Logs (filter by Auth)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
