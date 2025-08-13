"use server"

import { createServerComponentClient } from "@/lib/supabase/server"

export async function getRevenueData(tenantId: string, startDate: string, endDate: string) {
  const supabase = createServerComponentClient()

  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      id,
      total_amount,
      status,
      created_at,
      job:jobs(
        id,
        job_number,
        client:clients(name)
      )
    `)
    .eq("tenant_id", tenantId)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at")

  return invoices || []
}

export async function getJobMetrics(tenantId: string, startDate: string, endDate: string) {
  const supabase = createServerComponentClient()

  const { data: jobs } = await supabase
    .from("jobs")
    .select(`
      id,
      status,
      created_at,
      completed_at,
      estimated_completion,
      assigned_technician:user_profiles!jobs_assigned_technician_fkey(
        id,
        first_name,
        last_name
      )
    `)
    .eq("tenant_id", tenantId)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at")

  return jobs || []
}

export async function getTechnicianProductivity(tenantId: string, startDate: string, endDate: string) {
  const supabase = createServerComponentClient()

  const { data: productivity } = await supabase
    .from("jobs")
    .select(`
      id,
      status,
      created_at,
      completed_at,
      assigned_technician:user_profiles!jobs_assigned_technician_fkey(
        id,
        first_name,
        last_name
      )
    `)
    .eq("tenant_id", tenantId)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .not("assigned_technician", "is", null)
    .order("created_at")

  return productivity || []
}

export async function getOverdueData(tenantId: string) {
  const supabase = createServerComponentClient()

  // Get overdue jobs
  const { data: overdueJobs } = await supabase
    .from("jobs")
    .select(`
      id,
      job_number,
      status,
      estimated_completion,
      client:clients(name),
      vehicle:vehicles(make, model, registration)
    `)
    .eq("tenant_id", tenantId)
    .lt("estimated_completion", new Date().toISOString())
    .not("status", "in", ("completed", "collected"))

  // Get overdue payments
  const { data: overduePayments } = await supabase
    .from("invoices")
    .select(`
      id,
      invoice_number,
      total_amount,
      due_date,
      status,
      job:jobs(
        job_number,
        client:clients(name)
      )
    `)
    .eq("tenant_id", tenantId)
    .lt("due_date", new Date().toISOString())
    .neq("status", "paid")

  return {
    overdueJobs: overdueJobs || [],
    overduePayments: overduePayments || [],
  }
}

export async function getDashboardMetrics(tenantId: string) {
  const supabase = createServerComponentClient()

  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Get current month revenue
  const { data: currentMonthInvoices } = await supabase
    .from("invoices")
    .select("total_amount")
    .eq("tenant_id", tenantId)
    .gte("created_at", new Date(today.getFullYear(), today.getMonth(), 1).toISOString())
    .eq("status", "paid")

  // Get active jobs count
  const { count: activeJobsCount } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .in("status", ["in_progress", "awaiting_parts", "ready_for_collection"])

  // Get completed jobs this month
  const { count: completedJobsCount } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "completed")
    .gte("completed_at", new Date(today.getFullYear(), today.getMonth(), 1).toISOString())

  // Get overdue counts
  const { count: overdueJobsCount } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .lt("estimated_completion", today.toISOString())
    .not("status", "in", ("completed", "collected"))

  const { count: overduePaymentsCount } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .lt("due_date", today.toISOString())
    .neq("status", "paid")

  const currentMonthRevenue = currentMonthInvoices?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0

  return {
    currentMonthRevenue,
    activeJobsCount: activeJobsCount || 0,
    completedJobsCount: completedJobsCount || 0,
    overdueJobsCount: overdueJobsCount || 0,
    overduePaymentsCount: overduePaymentsCount || 0,
  }
}
