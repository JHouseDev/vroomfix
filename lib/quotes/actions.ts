"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getCurrentUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Create a new quote
export async function createQuote(prevState: any, formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { user, profile } = await getCurrentUser()
  if (!user || !profile) {
    return { error: "Unauthorized" }
  }

  const jobId = formData.get("jobId")
  const title = formData.get("title")
  const description = formData.get("description")
  const validUntil = formData.get("validUntil")
  const termsAndConditions = formData.get("termsAndConditions")

  if (!jobId || !title) {
    return { error: "Job and title are required" }
  }

  try {
    // Generate quote number
    const quoteNumber = `QTE-${Date.now()}`

    // Get default tax rate
    const { data: taxConfig } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "default_tax_rate")
      .single()

    const taxRate = taxConfig?.value ? Number.parseFloat(taxConfig.value) : 15.0

    // Create the quote
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        tenant_id: profile.tenant_id,
        job_id: jobId.toString(),
        quote_number: quoteNumber,
        title: title.toString(),
        description: description?.toString(),
        tax_rate: taxRate,
        valid_until: validUntil ? new Date(validUntil.toString()).toISOString().split("T")[0] : null,
        terms_and_conditions: termsAndConditions?.toString(),
        created_by: user.id,
      })
      .select()
      .single()

    if (quoteError) {
      return { error: "Failed to create quote" }
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      entity_type: "quote",
      entity_id: quote.id,
      action: "created",
      new_values: quote,
    })

    revalidatePath("/quotes")
    revalidatePath(`/jobs/${jobId}`)

    return { success: "Quote created successfully", quoteId: quote.id }
  } catch (error) {
    console.error("Create quote error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Add line item to quote
export async function addQuoteItem(prevState: any, formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { user, profile } = await getCurrentUser()
  if (!user || !profile) {
    return { error: "Unauthorized" }
  }

  const quoteId = formData.get("quoteId")
  const itemType = formData.get("itemType")
  const description = formData.get("description")
  const quantity = formData.get("quantity")
  const unitPrice = formData.get("unitPrice")
  const hours = formData.get("hours")
  const hourlyRate = formData.get("hourlyRate")
  const partId = formData.get("partId")

  if (!quoteId || !itemType || !description) {
    return { error: "Quote ID, item type, and description are required" }
  }

  try {
    const qty = Number.parseFloat(quantity?.toString() || "1")
    let price = 0
    let totalPrice = 0

    if (itemType === "labor") {
      const hrs = Number.parseFloat(hours?.toString() || "0")
      const rate = Number.parseFloat(hourlyRate?.toString() || "0")
      price = rate
      totalPrice = hrs * rate
    } else {
      price = Number.parseFloat(unitPrice?.toString() || "0")
      totalPrice = qty * price
    }

    // Add quote item
    const { error: itemError } = await supabase.from("quote_items").insert({
      quote_id: quoteId.toString(),
      part_id: partId?.toString() || null,
      item_type: itemType.toString(),
      description: description.toString(),
      quantity: qty,
      unit_price: price,
      total_price: totalPrice,
      hours: itemType === "labor" ? Number.parseFloat(hours?.toString() || "0") : null,
      hourly_rate: itemType === "labor" ? Number.parseFloat(hourlyRate?.toString() || "0") : null,
    })

    if (itemError) {
      return { error: "Failed to add quote item" }
    }

    // Recalculate quote totals
    await recalculateQuoteTotals(quoteId.toString(), supabase)

    revalidatePath("/quotes")
    revalidatePath(`/quotes/${quoteId}`)

    return { success: "Item added successfully" }
  } catch (error) {
    console.error("Add quote item error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Send quote to client
export async function sendQuote(quoteId: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { user, profile } = await getCurrentUser()
  if (!user || !profile) {
    return { error: "Unauthorized" }
  }

  try {
    const { error } = await supabase
      .from("quotes")
      .update({
        status: "sent",
        updated_at: new Date().toISOString(),
      })
      .eq("id", quoteId)
      .eq("tenant_id", profile.tenant_id)

    if (error) {
      return { error: "Failed to send quote" }
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      entity_type: "quote",
      entity_id: quoteId,
      action: "sent",
    })

    revalidatePath("/quotes")
    revalidatePath(`/quotes/${quoteId}`)

    return { success: "Quote sent successfully" }
  } catch (error) {
    console.error("Send quote error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Client approve quote
export async function approveQuote(prevState: any, formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const quoteId = formData.get("quoteId")
  const signature = formData.get("signature")
  const clientIp = formData.get("clientIp")

  if (!quoteId || !signature) {
    return { error: "Quote ID and signature are required" }
  }

  try {
    // Update quote with approval
    const { error: quoteError } = await supabase
      .from("quotes")
      .update({
        status: "approved",
        client_approved: true,
        client_approved_at: new Date().toISOString(),
        client_signature: signature.toString(),
        client_ip_address: clientIp?.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", quoteId.toString())

    if (quoteError) {
      return { error: "Failed to approve quote" }
    }

    // Update related job
    const { data: quote } = await supabase.from("quotes").select("job_id").eq("id", quoteId.toString()).single()

    if (quote?.job_id) {
      await supabase
        .from("jobs")
        .update({
          quote_approved: true,
          quote_approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", quote.job_id)
    }

    revalidatePath("/quotes")
    revalidatePath(`/quotes/${quoteId}`)

    return { success: "Quote approved successfully" }
  } catch (error) {
    console.error("Approve quote error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Helper function to recalculate quote totals
async function recalculateQuoteTotals(quoteId: string, supabase: any) {
  // Get all quote items
  const { data: items } = await supabase.from("quote_items").select("total_price").eq("quote_id", quoteId)

  const subtotal = items?.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0) || 0

  // Get quote tax rate
  const { data: quote } = await supabase.from("quotes").select("tax_rate").eq("id", quoteId).single()

  const taxRate = quote?.tax_rate || 0
  const taxAmount = (subtotal * taxRate) / 100
  const totalAmount = subtotal + taxAmount

  // Update quote totals
  await supabase
    .from("quotes")
    .update({
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId)
}
