"use server"

import { createServerActionClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const createPartSchema = z.object({
  part_number: z.string().min(1, "Part number is required"),
  name: z.string().min(1, "Part name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  condition: z.enum(["new", "used", "refurbished"]),
  cost_price: z.number().min(0, "Cost price must be positive"),
  selling_price: z.number().min(0, "Selling price must be positive"),
  current_stock: z.number().min(0, "Stock must be positive"),
  minimum_stock: z.number().min(0, "Minimum stock must be positive"),
  location: z.string().optional(),
  supplier_id: z.string().uuid().optional(),
})

export async function createPart(formData: FormData) {
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

    const validatedFields = createPartSchema.parse({
      part_number: formData.get("part_number"),
      name: formData.get("name"),
      description: formData.get("description") || null,
      category: formData.get("category"),
      condition: formData.get("condition"),
      cost_price: Number.parseFloat(formData.get("cost_price") as string),
      selling_price: Number.parseFloat(formData.get("selling_price") as string),
      current_stock: Number.parseInt(formData.get("current_stock") as string),
      minimum_stock: Number.parseInt(formData.get("minimum_stock") as string),
      location: formData.get("location") || null,
      supplier_id: formData.get("supplier_id") || null,
    })

    const { error } = await supabase.from("inventory_parts").insert({
      ...validatedFields,
      tenant_id: profile.tenant_id,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    return { error: "Failed to create part" }
  }
}

export async function updatePartStock(partId: string, newStock: number, reason: string) {
  const supabase = createServerActionClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Not authenticated" }
    }

    // Get current stock
    const { data: part } = await supabase
      .from("inventory_parts")
      .select("current_stock, tenant_id")
      .eq("id", partId)
      .single()

    if (!part) {
      return { error: "Part not found" }
    }

    const stockChange = newStock - part.current_stock

    // Update stock
    const { error: updateError } = await supabase
      .from("inventory_parts")
      .update({ current_stock: newStock })
      .eq("id", partId)

    if (updateError) {
      return { error: updateError.message }
    }

    // Record stock movement
    const { error: movementError } = await supabase.from("inventory_movements").insert({
      tenant_id: part.tenant_id,
      part_id: partId,
      movement_type: stockChange > 0 ? "in" : "out",
      quantity: Math.abs(stockChange),
      reason,
      user_id: user.id,
    })

    if (movementError) {
      return { error: movementError.message }
    }

    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    return { error: "Failed to update stock" }
  }
}

export async function createPurchaseOrder(formData: FormData) {
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

    const supplierId = formData.get("supplier_id") as string
    const notes = formData.get("notes") as string

    const { data: po, error: poError } = await supabase
      .from("purchase_orders")
      .insert({
        tenant_id: profile.tenant_id,
        supplier_id: supplierId,
        status: "pending",
        notes,
        created_by: user.id,
      })
      .select()
      .single()

    if (poError) {
      return { error: poError.message }
    }

    revalidatePath("/inventory/purchase-orders")
    redirect(`/inventory/purchase-orders/${po.id}`)
  } catch (error) {
    return { error: "Failed to create purchase order" }
  }
}

export async function getPartsForJob(jobId: string) {
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

    // Get parts allocated to this job
    const { data: allocatedParts, error } = await supabase
      .from("job_parts_allocation")
      .select(`
        *,
        part:inventory_parts(
          id,
          part_number,
          name,
          selling_price,
          current_stock,
          condition
        )
      `)
      .eq("job_id", jobId)

    if (error) {
      return { error: error.message }
    }

    return { data: allocatedParts }
  } catch (error) {
    return { error: "Failed to get job parts" }
  }
}

export async function updateStockFromJobUsage(
  jobId: string,
  partUsage: Array<{ partId: string; quantityUsed: number }>,
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

    // Update stock levels and record movements
    for (const usage of partUsage) {
      // Get current stock
      const { data: part } = await supabase
        .from("inventory_parts")
        .select("current_stock, name")
        .eq("id", usage.partId)
        .eq("tenant_id", profile.tenant_id)
        .single()

      if (!part) {
        continue
      }

      const newStock = Math.max(0, part.current_stock - usage.quantityUsed)

      // Update stock
      await supabase.from("inventory_parts").update({ current_stock: newStock }).eq("id", usage.partId)

      // Record movement
      await supabase.from("inventory_movements").insert({
        tenant_id: profile.tenant_id,
        part_id: usage.partId,
        movement_type: "out",
        quantity: usage.quantityUsed,
        reason: `Used on job ${jobId}`,
        reference_id: jobId,
        reference_type: "job",
        user_id: user.id,
      })
    }

    revalidatePath("/inventory")
    revalidatePath(`/jobs/${jobId}`)
    return { success: true }
  } catch (error) {
    return { error: "Failed to update stock from job usage" }
  }
}

export async function getLowStockAlerts() {
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

    const { data: lowStockParts, error } = await supabase
      .from("inventory_parts")
      .select("id, part_number, name, current_stock, minimum_stock")
      .eq("tenant_id", profile.tenant_id)
      .filter("current_stock", "lte", "minimum_stock")
      .order("name")

    if (error) {
      return { error: error.message }
    }

    return { data: lowStockParts }
  } catch (error) {
    return { error: "Failed to get low stock alerts" }
  }
}
