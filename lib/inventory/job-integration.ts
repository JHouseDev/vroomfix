"use server"

import { createServerActionClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function allocatePartsToJob(jobId: string, parts: Array<{ partId: string; quantity: number }>) {
  const supabase = createServerActionClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Not authenticated" }
    }

    // Get user's tenant
    const { data: profile } = await supabase.from("user_profiles").select("tenant_id").eq("user_id", user.id).single()
    if (!profile) {
      return { error: "User profile not found" }
    }

    // Check if parts are available
    for (const part of parts) {
      const { data: partData } = await supabase
        .from("inventory_parts")
        .select("current_stock, name")
        .eq("id", part.partId)
        .eq("tenant_id", profile.tenant_id)
        .single()

      if (!partData || partData.current_stock < part.quantity) {
        return { error: `Insufficient stock for ${partData?.name || "part"}` }
      }
    }

    // Allocate parts
    const allocations = parts.map((part) => ({
      tenant_id: profile.tenant_id,
      job_id: jobId,
      part_id: part.partId,
      quantity_allocated: part.quantity,
      allocated_by: user.id,
    }))

    const { error } = await supabase.from("job_parts_allocation").insert(allocations)
    if (error) {
      return { error: error.message }
    }

    // Reserve stock
    for (const part of parts) {
      await supabase.rpc("reserve_part_stock", {
        part_id: part.partId,
        quantity: part.quantity,
      })
    }

    revalidatePath(`/jobs/${jobId}`)
    return { success: true }
  } catch (error) {
    return { error: "Failed to allocate parts" }
  }
}

export async function recordPartsUsage(
  jobId: string,
  partsUsed: Array<{ partId: string; quantityUsed: number; notes?: string }>,
) {
  const supabase = createServerActionClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Not authenticated" }
    }

    const { data: profile } = await supabase.from("user_profiles").select("tenant_id").eq("user_id", user.id).single()
    if (!profile) {
      return { error: "User profile not found" }
    }

    // Record parts usage
    for (const part of partsUsed) {
      // Update allocation with actual usage
      await supabase
        .from("job_parts_allocation")
        .update({
          quantity_used: part.quantityUsed,
          usage_notes: part.notes,
          used_at: new Date().toISOString(),
          used_by: user.id,
        })
        .eq("job_id", jobId)
        .eq("part_id", part.partId)

      // Update actual stock
      const { data: partData } = await supabase
        .from("inventory_parts")
        .select("current_stock")
        .eq("id", part.partId)
        .single()

      if (partData) {
        await supabase
          .from("inventory_parts")
          .update({ current_stock: partData.current_stock - part.quantityUsed })
          .eq("id", part.partId)

        // Record stock movement
        await supabase.from("inventory_movements").insert({
          tenant_id: profile.tenant_id,
          part_id: part.partId,
          movement_type: "out",
          quantity: part.quantityUsed,
          reason: `Used on job ${jobId}`,
          reference_id: jobId,
          reference_type: "job",
          user_id: user.id,
        })
      }
    }

    revalidatePath(`/jobs/${jobId}`)
    return { success: true }
  } catch (error) {
    return { error: "Failed to record parts usage" }
  }
}

export async function getJobPartsAllocation(jobId: string) {
  const supabase = createServerActionClient()

  const { data, error } = await supabase
    .from("job_parts_allocation")
    .select(`
      *,
      part:inventory_parts(
        id,
        part_number,
        name,
        selling_price,
        current_stock
      )
    `)
    .eq("job_id", jobId)

  if (error) {
    return { error: error.message }
  }

  return { data }
}
