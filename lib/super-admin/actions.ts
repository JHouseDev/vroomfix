"use server"

import { createServerActionClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createTenantSchema = z.object({
  name: z.string().min(1, "Tenant name is required"),
  subdomain: z
    .string()
    .min(1, "Subdomain is required")
    .regex(/^[a-z0-9-]+$/, "Invalid subdomain format"),
  subscription_tier: z.string().min(1, "Subscription tier is required"),
  admin_email: z.string().email("Valid email is required"),
  admin_first_name: z.string().min(1, "First name is required"),
  admin_last_name: z.string().min(1, "Last name is required"),
})

const updateBrandingSchema = z.object({
  primary_color: z.string().min(1, "Primary color is required"),
  secondary_color: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
  company_name: z.string().min(1, "Company name is required"),
  custom_domain: z.string().optional().or(z.literal("")),
})

export async function createTenant(formData: FormData) {
  const supabase = createServerActionClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Not authenticated" }
    }

    // Verify super admin role
    const { data: profile } = await supabase.from("user_profiles").select("role").eq("user_id", user.id).single()

    if (!profile || profile.role !== "super_admin") {
      return { error: "Unauthorized" }
    }

    const validatedFields = createTenantSchema.parse({
      name: formData.get("name"),
      subdomain: formData.get("subdomain"),
      subscription_tier: formData.get("subscription_tier"),
      admin_email: formData.get("admin_email"),
      admin_first_name: formData.get("admin_first_name"),
      admin_last_name: formData.get("admin_last_name"),
    })

    // Check if subdomain is available
    const { data: existingTenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("subdomain", validatedFields.subdomain)
      .single()

    if (existingTenant) {
      return { error: "Subdomain already exists" }
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        name: validatedFields.name,
        subdomain: validatedFields.subdomain,
        subscription_tier: validatedFields.subscription_tier,
        status: "active",
      })
      .select()
      .single()

    if (tenantError) {
      return { error: tenantError.message }
    }

    // Create tenant admin user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: validatedFields.admin_email,
      password: Math.random().toString(36).slice(-12), // Generate temporary password
      email_confirm: true,
    })

    if (authError) {
      // Cleanup tenant if user creation fails
      await supabase.from("tenants").delete().eq("id", tenant.id)
      return { error: authError.message }
    }

    // Create user profile
    const { error: profileError } = await supabase.from("user_profiles").insert({
      user_id: authUser.user.id,
      tenant_id: tenant.id,
      email: validatedFields.admin_email,
      first_name: validatedFields.admin_first_name,
      last_name: validatedFields.admin_last_name,
      role: "admin",
      status: "active",
    })

    if (profileError) {
      // Cleanup on error
      await supabase.auth.admin.deleteUser(authUser.user.id)
      await supabase.from("tenants").delete().eq("id", tenant.id)
      return { error: profileError.message }
    }

    revalidatePath("/super-admin/tenants")
    return { success: true, tenant }
  } catch (error) {
    return { error: "Failed to create tenant" }
  }
}

export async function updateTenantBranding(tenantId: string, formData: FormData) {
  const supabase = createServerActionClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Not authenticated" }
    }

    // Verify super admin role or tenant admin
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role, tenant_id")
      .eq("user_id", user.id)
      .single()

    if (!profile || (profile.role !== "super_admin" && profile.tenant_id !== tenantId)) {
      return { error: "Unauthorized" }
    }

    const validatedFields = updateBrandingSchema.parse({
      primary_color: formData.get("primary_color"),
      secondary_color: formData.get("secondary_color") || null,
      logo_url: formData.get("logo_url") || null,
      company_name: formData.get("company_name"),
      custom_domain: formData.get("custom_domain") || null,
    })

    const { error } = await supabase.from("tenant_branding").upsert({
      tenant_id: tenantId,
      ...validatedFields,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/super-admin/tenants")
    revalidatePath(`/super-admin/tenants/${tenantId}`)
    return { success: true }
  } catch (error) {
    return { error: "Failed to update branding" }
  }
}

export async function updateTenantFeatures(tenantId: string, features: Record<string, boolean>) {
  const supabase = createServerActionClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Not authenticated" }
    }

    // Verify super admin role
    const { data: profile } = await supabase.from("user_profiles").select("role").eq("user_id", user.id).single()

    if (!profile || profile.role !== "super_admin") {
      return { error: "Unauthorized" }
    }

    const { error } = await supabase.from("tenant_features").upsert({
      tenant_id: tenantId,
      ...features,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/super-admin/tenants")
    revalidatePath(`/super-admin/tenants/${tenantId}`)
    return { success: true }
  } catch (error) {
    return { error: "Failed to update features" }
  }
}

export async function getTenantAnalytics(tenantId?: string) {
  const supabase = createServerActionClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Not authenticated" }
    }

    // Verify super admin role
    const { data: profile } = await supabase.from("user_profiles").select("role").eq("user_id", user.id).single()

    if (!profile || profile.role !== "super_admin") {
      return { error: "Unauthorized" }
    }

    const tenantFilter = tenantId ? { tenant_id: tenantId } : {}

    // Get tenant metrics
    const [{ count: totalJobs }, { count: totalInvoices }, { data: revenueData }, { count: activeUsers }] =
      await Promise.all([
        supabase.from("jobs").select("*", { count: "exact", head: true }).match(tenantFilter),
        supabase.from("invoices").select("*", { count: "exact", head: true }).match(tenantFilter),
        supabase.from("invoices").select("total_amount, created_at").match(tenantFilter).eq("status", "paid"),
        supabase
          .from("user_profiles")
          .select("*", { count: "exact", head: true })
          .match(tenantFilter)
          .eq("status", "active"),
      ])

    const totalRevenue = revenueData?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0

    return {
      success: true,
      data: {
        totalJobs: totalJobs || 0,
        totalInvoices: totalInvoices || 0,
        totalRevenue,
        activeUsers: activeUsers || 0,
      },
    }
  } catch (error) {
    return { error: "Failed to get analytics" }
  }
}
