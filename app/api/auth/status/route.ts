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
  const email = user?.email?.toLowerCase() ?? null
  const isAdmin = isAdminEmail(email)
  const vendorSessionName = getVendorFromCookieStore(cookieStore)
  
  // Check collector session
  const collectorSessionToken = cookieStore.get("collector_session")?.value
  const collectorSession = verifyCollectorSessionToken(collectorSessionToken)
  const hasCollectorSession = !!collectorSession?.email
  
  // Check if admin also has collector orders (for role selection)
  let adminHasCollectorAccess = false
  if (isAdmin && email) {
    const { data: adminOrderMatch } = await serviceClient
      .from("orders")
      .select("customer_id")
      .eq("customer_email", email)
      .limit(1)
      .maybeSingle()
    
    adminHasCollectorAccess = !!adminOrderMatch
  }
  
  // Check if admin session cookie exists
  const adminSessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const adminSessionPayload = verifyAdminSessionToken(adminSessionToken)
  const hasAdminSession = !!adminSessionPayload?.email && isAdminEmail(adminSessionPayload.email)

  const requireAccountSelection = cookieStore.get(REQUIRE_ACCOUNT_SELECTION_COOKIE)?.value === "true"

  let vendor = null as null | { id: number; vendor_name: string; status: string | null }

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
    hasCollectorSession,
    collectorEmail: collectorSession?.email || null,
    vendorSession: vendorSessionName,
    vendor,
    requireAccountSelection,
  })
}


