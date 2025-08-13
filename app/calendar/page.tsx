import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CalendarView from "@/components/calendar/calendar-view"

export default async function CalendarPage() {
  const { user, profile } = await getCurrentUser()

  if (!user || !profile) {
    redirect("/auth/login")
  }

  const supabase = createClient()

  // Get calendar events
  let query = supabase
    .from("calendar_events")
    .select(`
      *,
      job:jobs(
        job_number,
        client:clients(first_name, last_name)
      ),
      assigned_user:users(first_name, last_name)
    `)
    .eq("tenant_id", profile.tenant_id)

  // Filter by assigned user for technicians
  if (profile.role?.name === "technician") {
    query = query.eq("assigned_user_id", user.id)
  }

  const { data: events } = await query.order("start_time", { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-600">Schedule and manage appointments</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CalendarView events={events || []} userRole={profile.role?.name} />
      </main>
    </div>
  )
}
