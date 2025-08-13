"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getCurrentUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Create calendar event
export async function createCalendarEvent(prevState: any, formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { user, profile } = await getCurrentUser()
  if (!user || !profile) {
    return { error: "Unauthorized" }
  }

  const title = formData.get("title")
  const description = formData.get("description")
  const startTime = formData.get("startTime")
  const endTime = formData.get("endTime")
  const jobId = formData.get("jobId")
  const assignedUserId = formData.get("assignedUserId")
  const eventType = formData.get("eventType") || "appointment"
  const allDay = formData.get("allDay") === "true"

  if (!title || !startTime || !endTime) {
    return { error: "Title, start time, and end time are required" }
  }

  try {
    const { data: event, error: eventError } = await supabase
      .from("calendar_events")
      .insert({
        tenant_id: profile.tenant_id,
        job_id: jobId?.toString() || null,
        assigned_user_id: assignedUserId?.toString() || null,
        title: title.toString(),
        description: description?.toString(),
        start_time: new Date(startTime.toString()).toISOString(),
        end_time: new Date(endTime.toString()).toISOString(),
        all_day: allDay,
        event_type: eventType.toString(),
        created_by: user.id,
      })
      .select()
      .single()

    if (eventError) {
      return { error: "Failed to create calendar event" }
    }

    // If this is a job-related event, update the job's scheduled dates
    if (jobId && eventType === "job") {
      await supabase
        .from("jobs")
        .update({
          scheduled_start_date: new Date(startTime.toString()).toISOString(),
          scheduled_end_date: new Date(endTime.toString()).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId.toString())
        .eq("tenant_id", profile.tenant_id)
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      entity_type: "calendar_event",
      entity_id: event.id,
      action: "created",
      new_values: event,
    })

    revalidatePath("/calendar")
    revalidatePath("/dashboard")

    return { success: "Event created successfully", eventId: event.id }
  } catch (error) {
    console.error("Create calendar event error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Update calendar event
export async function updateCalendarEvent(prevState: any, formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { user, profile } = await getCurrentUser()
  if (!user || !profile) {
    return { error: "Unauthorized" }
  }

  const eventId = formData.get("eventId")
  const title = formData.get("title")
  const description = formData.get("description")
  const startTime = formData.get("startTime")
  const endTime = formData.get("endTime")
  const status = formData.get("status")

  if (!eventId || !title || !startTime || !endTime) {
    return { error: "Event ID, title, start time, and end time are required" }
  }

  try {
    const { error } = await supabase
      .from("calendar_events")
      .update({
        title: title.toString(),
        description: description?.toString(),
        start_time: new Date(startTime.toString()).toISOString(),
        end_time: new Date(endTime.toString()).toISOString(),
        status: status?.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId.toString())
      .eq("tenant_id", profile.tenant_id)

    if (error) {
      return { error: "Failed to update calendar event" }
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      entity_type: "calendar_event",
      entity_id: eventId.toString(),
      action: "updated",
    })

    revalidatePath("/calendar")
    revalidatePath(`/calendar/events/${eventId}`)

    return { success: "Event updated successfully" }
  } catch (error) {
    console.error("Update calendar event error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Delete calendar event
export async function deleteCalendarEvent(eventId: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { user, profile } = await getCurrentUser()
  if (!user || !profile) {
    return { error: "Unauthorized" }
  }

  try {
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", eventId)
      .eq("tenant_id", profile.tenant_id)

    if (error) {
      return { error: "Failed to delete calendar event" }
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      entity_type: "calendar_event",
      entity_id: eventId,
      action: "deleted",
    })

    revalidatePath("/calendar")

    return { success: "Event deleted successfully" }
  } catch (error) {
    console.error("Delete calendar event error:", error)
    return { error: "An unexpected error occurred" }
  }
}
