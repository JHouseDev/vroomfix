"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getCurrentUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Create invoice from quote
export async function createInvoiceFromQuote(quoteId: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { user, profile } = await getCurrentUser()
  if (!user || !profile) {
    return { error: "Unauthorized" }
  }

  try {
    // Get quote details
    const { data: quote } = await supabase
      .from("quotes")
      .select(`
        *,
        job:jobs(client_id),
        items:quote_items(*)
      `)
      .eq("id", quoteId)
      .eq("tenant_id", profile.tenant_id)
      .single()

    if (!quote) {
      return { error: "Quote not found" }
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`

    // Get default due days
    const { data: dueDaysConfig } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "default_invoice_due_days")
      .single()

    const dueDays = dueDaysConfig?.value ? Number.parseInt(dueDaysConfig.value) : 30
    const issueDate = new Date()
    const dueDate = new Date(issueDate)
    dueDate.setDate(dueDate.getDate() + dueDays)

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        tenant_id: profile.tenant_id,
        job_id: quote.job_id,
        quote_id: quoteId,
        client_id: quote.job.client_id,
        invoice_number: invoiceNumber,
        title: quote.title,
        subtotal: quote.subtotal,
        tax_rate: quote.tax_rate,
        tax_amount: quote.tax_amount,
        total_amount: quote.total_amount,
        amount_due: quote.total_amount,
        issue_date: issueDate.toISOString().split("T")[0],
        due_date: dueDate.toISOString().split("T")[0],
        terms_and_conditions: quote.terms_and_conditions,
        created_by: user.id,
      })
      .select()
      .single()

    if (invoiceError) {
      return { error: "Failed to create invoice" }
    }

    // Copy quote items to invoice items
    if (quote.items && quote.items.length > 0) {
      const invoiceItems = quote.items.map((item: any) => ({
        invoice_id: invoice.id,
        part_id: item.part_id,
        item_type: item.item_type,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        hours: item.hours,
        hourly_rate: item.hourly_rate,
        order_index: item.order_index,
      }))

      await supabase.from("invoice_items").insert(invoiceItems)
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      entity_type: "invoice",
      entity_id: invoice.id,
      action: "created_from_quote",
      new_values: { quote_id: quoteId, invoice_id: invoice.id },
    })

    revalidatePath("/invoices")
    revalidatePath("/quotes")
    revalidatePath(`/quotes/${quoteId}`)

    return { success: "Invoice created successfully", invoiceId: invoice.id }
  } catch (error) {
    console.error("Create invoice from quote error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Mark invoice as paid
export async function markInvoicePaid(prevState: any, formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { user, profile } = await getCurrentUser()
  if (!user || !profile) {
    return { error: "Unauthorized" }
  }

  const invoiceId = formData.get("invoiceId")
  const paymentMethod = formData.get("paymentMethod")
  const paymentReference = formData.get("paymentReference")
  const amountPaid = formData.get("amountPaid")

  if (!invoiceId || !amountPaid) {
    return { error: "Invoice ID and amount paid are required" }
  }

  try {
    const paidAmount = Number.parseFloat(amountPaid.toString())

    // Get current invoice
    const { data: invoice } = await supabase
      .from("invoices")
      .select("total_amount, amount_paid")
      .eq("id", invoiceId.toString())
      .eq("tenant_id", profile.tenant_id)
      .single()

    if (!invoice) {
      return { error: "Invoice not found" }
    }

    const newAmountPaid = (invoice.amount_paid || 0) + paidAmount
    const amountDue = invoice.total_amount - newAmountPaid
    const isPaid = amountDue <= 0

    // Update invoice
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        amount_paid: newAmountPaid,
        amount_due: Math.max(0, amountDue),
        status: isPaid ? "paid" : "partial",
        paid_date: isPaid ? new Date().toISOString().split("T")[0] : null,
        payment_method: paymentMethod?.toString(),
        payment_reference: paymentReference?.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId.toString())
      .eq("tenant_id", profile.tenant_id)

    if (updateError) {
      return { error: "Failed to update invoice" }
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      entity_type: "invoice",
      entity_id: invoiceId.toString(),
      action: "payment_recorded",
      new_values: { amount_paid: paidAmount, payment_method: paymentMethod },
    })

    revalidatePath("/invoices")
    revalidatePath(`/invoices/${invoiceId}`)

    return { success: "Payment recorded successfully" }
  } catch (error) {
    console.error("Mark invoice paid error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Send invoice to client
export async function sendInvoice(invoiceId: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { user, profile } = await getCurrentUser()
  if (!user || !profile) {
    return { error: "Unauthorized" }
  }

  try {
    const { error } = await supabase
      .from("invoices")
      .update({
        status: "sent",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)
      .eq("tenant_id", profile.tenant_id)

    if (error) {
      return { error: "Failed to send invoice" }
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      entity_type: "invoice",
      entity_id: invoiceId,
      action: "sent",
    })

    revalidatePath("/invoices")
    revalidatePath(`/invoices/${invoiceId}`)

    return { success: "Invoice sent successfully" }
  } catch (error) {
    console.error("Send invoice error:", error)
    return { error: "An unexpected error occurred" }
  }
}
