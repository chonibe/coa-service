import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { isAdminEmail, REQUIRE_ACCOUNT_SELECTION_COOKIE } from "@/lib/vendor-auth"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
import { verifyCollectorSessionToken } from "@/lib/collector-session"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)
  const serviceClient = createServiceClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error("Failed to fetch Supabase session:", error)
  }

  const user = session?.user ?? null
  const supabaseEmail = user?.email?.toLowerCase() ?? null
  const vendorSessionName = getVendorFromCookieStore(cookieStore)
  
  // Check collector session
  const collectorSessionToken = cookieStore.get("collector_session")?.value
  const collectorSession = verifyCollectorSessionToken(collectorSessionToken)
  const hasCollectorSession = !!collectorSession?.email
  
  // Check if admin session cookie exists - this is our source of truth for admin status
  const adminSessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const adminSessionPayload = verifyAdminSessionToken(adminSessionToken)
  const adminSessionEmail = adminSessionPayload?.email?.toLowerCase() ?? null
  const hasAdminSession = !!adminSessionEmail && isAdminEmail(adminSessionEmail)
  
  // Use admin session email as fallback when Supabase session is missing
  // This prevents login loops when the Supabase session expires but admin cookie is still valid
  const email = supabaseEmail ?? adminSessionEmail
  
  // isAdmin should be true if EITHER:
  // 1. The Supabase session user has an admin email, OR
  // 2. There's a valid admin session cookie with an admin email
  const isAdmin = isAdminEmail(supabaseEmail) || hasAdminSession
  
  // Check if admin also has collector orders (for role selection)
  let adminHasCollectorAccess = false
  let adminHasVendorAccess = false
  
  // Use the effective email (from Supabase or admin session) for access checks
  const effectiveAdminEmail = isAdmin ? (supabaseEmail ?? adminSessionEmail) : null
  
  if (isAdmin && effectiveAdminEmail) {
    const { data: adminOrderMatch } = await serviceClient
      .from("orders")
      .select("customer_id")
      .eq("customer_email", effectiveAdminEmail)
      .limit(1)
      .maybeSingle()
    
    adminHasCollectorAccess = !!adminOrderMatch
    
    // Check if admin has vendor access via vendor_users table
    // Note: This requires Supabase session for user.id - if not available, we skip this check
    if (user?.id) {
      const { data: adminVendorUser } = await serviceClient
        .from("vendor_users")
        .select("vendor_id")
        .eq("auth_id", user.id)
        .maybeSingle()
      
      adminHasVendorAccess = !!adminVendorUser
    }
  }

  const requireAccountSelection = cookieStore.get(REQUIRE_ACCOUNT_SELECTION_COOKIE)?.value === "true"

  let vendor = null as null | { id: number; vendor_name: string; status: string | null }
  let vendorHasCollectorAccess = false

  // Check if admin is impersonating via vendor session cookie
  if (vendorSessionName) {
    const { data: vendorRecord, error: vendorError } = await serviceClient
      .from("vendors")
      .select("id,vendor_name,status")
      .eq("vendor_name", vendorSessionName)
      .maybeSingle()

    if (vendorError) {
      console.error("Failed to load vendor from session", vendorError)
    } else if (vendorRecord) {
      vendor = vendorRecord
    }
  } else if (user?.id) {
    const { data: vendorUser, error: vendorUserError } = await serviceClient
      .from("vendor_users")
      .select("vendor_id")
      .eq("auth_id", user.id)
      .maybeSingle()

    if (vendorUserError) {
      console.error("Failed to look up vendor user", vendorUserError)
    }

    if (vendorUser?.vendor_id) {
      const { data: vendorRecord, error: vendorError } = await serviceClient
        .from("vendors")
        .select("id,vendor_name,status")
        .eq("id", vendorUser.vendor_id)
        .maybeSingle()

      if (vendorError) {
        console.error("Failed to load vendor for status endpoint", vendorError)
      } else if (vendorRecord) {
        vendor = vendorRecord
      }
    }
  }

  // Check if vendor has collector access (has orders or collector profile)
  if (vendor && email) {
    const { data: vendorOrderMatch } = await serviceClient
      .from("orders")
      .select("customer_id")
      .eq("customer_email", email)
      .limit(1)
      .maybeSingle()

    const { data: vendorProfileMatch } = await serviceClient
      .from("collector_profiles")
      .select("id")
      .eq("email", email)
      .limit(1)
      .maybeSingle()

    vendorHasCollectorAccess = !!(vendorOrderMatch || vendorProfileMatch)
  }

  return NextResponse.json({
    authenticated: !!user,
    user: user
      ? {
          id: user.id,
          email,
          app_metadata: user.app_metadata,
        }
      : null,
    isAdmin,
    hasAdminSession,
    adminHasCollectorAccess,
    adminHasVendorAccess,
    hasCollectorSession,
    collectorEmail: collectorSession?.email || null,
    vendorSession: vendorSessionName,
    vendor,
    hasVendorAccess: !!vendor,
    vendorHasCollectorAccess,
    requireAccountSelection,
  })
}


