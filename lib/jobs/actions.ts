"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getCurrentUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Create a new job
export async function createJob(prevState: any, formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { user, profile } = await getCurrentUser()
  if (!user || !profile) {
    return { error: "Unauthorized" }
  }

  const clientId = formData.get("clientId")
  const vehicleId = formData.get("vehicleId")
  const title = formData.get("title")
  const description = formData.get("description")
  const priority = formData.get("priority") || "medium"
  const estimatedHours = formData.get("estimatedHours")
  const scheduledStartDate = formData.get("scheduledStartDate")

  if (!clientId || !vehicleId || !title || !description) {
    return { error: "All required fields must be filled" }
  }

  try {
    // Generate job number
    const jobNumber = `JOB-${Date.now()}`

    // Get default "Request Received" status
    const { data: defaultStatus } = await supabase
      .from("job_statuses")
      .select("id")
      .eq("name", "Request Received")
      .single()

    // Create the job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        tenant_id: profile.tenant_id,
        client_id: clientId.toString(),
        vehicle_id: vehicleId.toString(),
        job_number: jobNumber,
        title: title.toString(),
        description: description.toString(),
        priority: priority.toString(),
        estimated_hours: estimatedHours ? Number.parseFloat(estimatedHours.toString()) : null,
        scheduled_start_date: scheduledStartDate ? new Date(scheduledStartDate.toString()).toISOString() : null,
        status_id: defaultStatus?.id,
        created_by: user.id,
      })
      .select()
      .single()

    if (jobError) {
      return { error: "Failed to create job" }
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      entity_type: "job",
      entity_id: job.id,
      action: "created",
      new_values: job,
    })

    revalidatePath("/dashboard")
    revalidatePath("/jobs")

    return { success: "Job created successfully", jobId: job.id }
  } catch (error) {
    console.error("Create job error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Update job status
export async function updateJobStatus(jobId: string, statusId: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { user, profile } = await getCurrentUser()
  if (!user || !profile) {
    return { error: "Unauthorized" }
  }

  try {
    // Get current job data
    const { data: currentJob } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("tenant_id", profile.tenant_id)
      .single()

    if (!currentJob) {
      return { error: "Job not found" }
    }

    // Update job status
    const { data: updatedJob, error } = await supabase
      .from("jobs")
      .update({
        status_id: statusId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single()

    if (error) {
      return { error: "Failed to update job status" }
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      entity_type: "job",
      entity_id: jobId,
      action: "status_updated",
      old_values: { status_id: currentJob.status_id },
      new_values: { status_id: statusId },
    })

    revalidatePath("/dashboard")
    revalidatePath("/jobs")
    revalidatePath(`/jobs/${jobId}`)

    return { success: "Job status updated successfully" }
  } catch (error) {
    console.error("Update job status error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Assign technician to job
export async function assignTechnician(jobId: string, technicianId: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { user, profile } = await getCurrentUser()
  if (!user || !profile) {
    return { error: "Unauthorized" }
  }

  try {
    const { error } = await supabase
      .from("jobs")
      .update({
        assigned_technician_id: technicianId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .eq("tenant_id", profile.tenant_id)

    if (error) {
      return { error: "Failed to assign technician" }
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      entity_type: "job",
      entity_id: jobId,
      action: "technician_assigned",
      new_values: { assigned_technician_id: technicianId },
    })

    revalidatePath("/dashboard")
    revalidatePath("/jobs")
    revalidatePath(`/jobs/${jobId}`)

    return { success: "Technician assigned successfully" }
  } catch (error) {
    console.error("Assign technician error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Update job progress
export async function updateJobProgress(prevState: any, formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { user, profile } = await getCurrentUser()
  if (!user || !profile) {
    return { error: "Unauthorized" }
  }

  const jobId = formData.get("jobId")
  const actualHours = formData.get("actualHours")
  const internalNotes = formData.get("internalNotes")
  const actualStartDate = formData.get("actualStartDate")
  const actualEndDate = formData.get("actualEndDate")

  if (!jobId) {
    return { error: "Job ID is required" }
  }

  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (actualHours) updateData.actual_hours = Number.parseFloat(actualHours.toString())
    if (internalNotes) updateData.internal_notes = internalNotes.toString()
    if (actualStartDate) updateData.actual_start_date = new Date(actualStartDate.toString()).toISOString()
    if (actualEndDate) updateData.actual_end_date = new Date(actualEndDate.toString()).toISOString()

    const { error } = await supabase
      .from("jobs")
      .update(updateData)
      .eq("id", jobId.toString())
      .eq("tenant_id", profile.tenant_id)

    if (error) {
      return { error: "Failed to update job progress" }
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      entity_type: "job",
      entity_id: jobId.toString(),
      action: "progress_updated",
      new_values: updateData,
    })

    revalidatePath("/dashboard")
    revalidatePath("/jobs")
    revalidatePath(`/jobs/${jobId}`)

    return { success: "Job progress updated successfully" }
  } catch (error) {
    console.error("Update job progress error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Approve job work
export async function approveJobWork(jobId: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { user, profile } = await getCurrentUser()
  if (!user || !profile) {
    return { error: "Unauthorized" }
  }

  try {
    const { error } = await supabase
      .from("jobs")
      .update({
        work_authorized: true,
        work_authorized_at: new Date().toISOString(),
        work_authorized_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .eq("tenant_id", profile.tenant_id)

    if (error) {
      return { error: "Failed to approve job work" }
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      entity_type: "job",
      entity_id: jobId,
      action: "work_authorized",
      new_values: { work_authorized: true, work_authorized_by: user.id },
    })

    revalidatePath("/dashboard")
    revalidatePath("/jobs")
    revalidatePath(`/jobs/${jobId}`)

    return { success: "Job work approved successfully" }
  } catch (error) {
    console.error("Approve job work error:", error)
    return { error: "An unexpected error occurred" }
  }
}
