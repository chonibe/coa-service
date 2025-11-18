import { createClient as createServiceClient } from "@/lib/supabase/server"

const serviceClient = () => createServiceClient()

export const logFailedLoginAttempt = async (params: {
  email?: string | null
  method: "email" | "oauth"
  reason?: string | null
  ip?: string | null
}) => {
  try {
    await serviceClient().from("failed_login_attempts").insert({
      email: params.email?.toLowerCase() ?? null,
      method: params.method,
      reason: params.reason ?? null,
      ip_address: params.ip ?? null,
    })
  } catch (error) {
    console.error("Failed to record failed login attempt", error)
  }
}

export const logImpersonation = async (params: {
  adminEmail: string
  vendorId?: number | null
  vendorName?: string | null
}) => {
  try {
    await serviceClient().from("impersonation_logs").insert({
      admin_email: params.adminEmail.toLowerCase(),
      vendor_id: params.vendorId ?? null,
      vendor_name: params.vendorName ?? null,
    })
  } catch (error) {
    console.error("Failed to record impersonation log", error)
  }
}

export const logAdminAction = async (params: {
  adminEmail: string
  actionType: "view" | "update" | "delete" | "create"
  vendorId?: number | null
  details?: Record<string, any> | null
}) => {
  try {
    await serviceClient().from("admin_actions").insert({
      admin_email: params.adminEmail.toLowerCase(),
      action_type: params.actionType,
      vendor_id: params.vendorId ?? null,
      details: params.details || null, // Supabase jsonb accepts objects directly
    })
  } catch (error) {
    console.error("Failed to record admin action", error)
  }
}
