import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore, buildVendorSessionCookie } from "@/lib/vendor-session"
import { isAdminEmail, REQUIRE_ACCOUNT_SELECTION_COOKIE } from "@/lib/vendor-auth"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
import { verifyCollectorSessionToken } from "@/lib/collector-session"
import { getUserActiveRoles, getUserVendorId } from "@/lib/rbac/role-helpers"

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
  const email = supabaseEmail ?? adminSessionEmail
  
  // Get user roles from RBAC system
  let userRoles: string[] = []
  let isAdmin = false
  let hasVendorRole = false
  let hasCollectorRole = false
  let vendorId: number | null = null
  
  if (user?.id) {
    userRoles = await getUserActiveRoles(user.id)
    isAdmin = userRoles.includes('admin')
    hasVendorRole = userRoles.includes('vendor')
    hasCollectorRole = userRoles.includes('collector')
    
    if (hasVendorRole) {
      vendorId = await getUserVendorId(user.id)
    }
    
    console.log(`[auth/status] User ${email} has roles: ${userRoles.join(', ')}`)
  } else if (hasAdminSession) {
    // Fallback for admin session cookie without Supabase session
    isAdmin = true
    userRoles = ['admin']
  }
  
  // For backwards compatibility, also check admin email
  if (!isAdmin && isAdminEmail(supabaseEmail)) {
    isAdmin = true
    if (!userRoles.includes('admin')) {
      userRoles.push('admin')
    }
  }

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
  } else if (vendorId) {
    // Use vendor ID from RBAC roles
    const { data: vendorRecord, error: vendorError } = await serviceClient
      .from("vendors")
      .select("id,vendor_name,status")
      .eq("id", vendorId)
      .maybeSingle()

    if (vendorError) {
      console.error("Failed to load vendor for status endpoint", vendorError)
    } else if (vendorRecord) {
      vendor = vendorRecord
    }
  }

  // Determine multi-role access
  const adminHasCollectorAccess = isAdmin && hasCollectorRole
  const adminHasVendorAccess = isAdmin && hasVendorRole
  const vendorHasCollectorAccess = hasVendorRole && hasCollectorRole

  // When user has vendor from RBAC but no vendor_session cookie, set the cookie
  // so the vendor layout accepts them and we don't bounce between login and dashboard
  const shouldSetVendorCookie = vendor && !vendorSessionName && !requireAccountSelection
  if (shouldSetVendorCookie) {
    console.log(`[auth/status] Setting vendor_session cookie for ${vendor.vendor_name} (had vendor role but no cookie)`)
  }

  const body = {
    authenticated: !!user,
    user: user
      ? {
          id: user.id,
          email,
          app_metadata: user.app_metadata,
        }
      : null,
    roles: userRoles,
    isAdmin,
    hasAdminSession,
    adminHasCollectorAccess,
    adminHasVendorAccess,
    hasCollectorSession,
    hasCollectorRole,
    hasVendorRole,
    collectorEmail: collectorSession?.email || null,
    vendorSession: shouldSetVendorCookie ? vendor.vendor_name : vendorSessionName,
    vendor,
    hasVendorAccess: !!vendor || hasVendorRole,
    vendorHasCollectorAccess,
    requireAccountSelection,
  }

  const response = NextResponse.json(body)

  if (shouldSetVendorCookie && vendor) {
    const cookie = buildVendorSessionCookie(vendor.vendor_name)
    response.cookies.set(cookie.name, cookie.value, cookie.options)
  }

  return response
}


