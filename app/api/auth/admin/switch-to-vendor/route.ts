import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-session"
import { buildVendorSessionCookie } from "@/lib/vendor-session"
import { clearCollectorSessionCookie } from "@/lib/collector-session"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { createClient as createRouteClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)
  
  // Verify admin session
  const adminSessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const adminSession = verifyAdminSessionToken(adminSessionToken)

  if (!adminSession?.email) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Admin session required" },
      { status: 401 }
    )
  }

  // Get user from Supabase session
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", message: "User session required" },
      { status: 401 }
    )
  }

  // Check if admin has vendor access
  const serviceClient = createServiceClient()
  const { data: vendorUser, error: vendorUserError } = await serviceClient
    .from("vendor_users")
    .select("vendor_id")
    .eq("auth_id", user.id)
    .maybeSingle()

  if (vendorUserError) {
    console.error("[admin-switch-vendor] vendor lookup failed", vendorUserError)
    return NextResponse.json(
      { error: "Database error", message: "Failed to verify vendor access" },
      { status: 500 }
    )
  }

  if (!vendorUser?.vendor_id) {
    return NextResponse.json(
      { error: "No vendor access", message: "Admin does not have vendor access" },
      { status: 403 }
    )
  }

  // Get vendor details
  const { data: vendor, error: vendorError } = await serviceClient
    .from("vendors")
    .select("vendor_name")
    .eq("id", vendorUser.vendor_id)
    .maybeSingle()

  if (vendorError || !vendor) {
    console.error("[admin-switch-vendor] vendor fetch failed", vendorError)
    return NextResponse.json(
      { error: "Database error", message: "Failed to fetch vendor details" },
      { status: 500 }
    )
  }

  // Create vendor session
  const vendorCookie = buildVendorSessionCookie(vendor.vendor_name)

  const response = NextResponse.json({ success: true, vendorName: vendor.vendor_name })
  response.cookies.set(vendorCookie.name, vendorCookie.value, vendorCookie.options)
  
  // Clear collector session (admin can only be in one role at a time)
  const clearCollectorCookie = clearCollectorSessionCookie()
  response.cookies.set(clearCollectorCookie.name, "", clearCollectorCookie.options)
  response.cookies.set("shopify_customer_id", "", { path: "/", maxAge: 0 })

  // Keep admin session intact (don't clear it)
  console.log(`[admin-switch-vendor] Admin switched to vendor: ${vendor.vendor_name}`)
  return response
}
