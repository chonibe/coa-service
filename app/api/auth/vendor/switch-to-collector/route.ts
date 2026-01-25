import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { buildCollectorSessionCookie } from "@/lib/collector-session"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { createClient as createRouteClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)
  
  // Verify vendor session
  const vendorName = getVendorFromCookieStore(cookieStore)
  
  if (!vendorName) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Vendor session required" },
      { status: 401 }
    )
  }

  // Get user from Supabase session
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.email) {
    return NextResponse.json(
      { error: "Unauthorized", message: "User session required" },
      { status: 401 }
    )
  }

  const email = user.email.toLowerCase()

  // Check if vendor has collector orders or profile
  const serviceClient = createServiceClient()
  const { data: orderMatch, error: orderError } = await serviceClient
    .from("orders")
    .select("customer_id, shopify_id")
    .eq("customer_email", email)
    .order("processed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (orderError) {
    console.error("[vendor-switch-collector] order lookup failed", orderError)
    return NextResponse.json(
      { error: "Database error", message: "Failed to verify collector access" },
      { status: 500 }
    )
  }

  // Also check collector_profiles table
  const { data: profileMatch, error: profileError } = await serviceClient
    .from("collector_profiles")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle()

  if (profileError) {
    console.error("[vendor-switch-collector] profile lookup failed", profileError)
  }

  if (!orderMatch && !profileMatch) {
    return NextResponse.json(
      { error: "No collector access", message: "Vendor does not have collector orders or profile" },
      { status: 403 }
    )
  }

  const shopifyCustomerId = orderMatch?.customer_id || orderMatch?.shopify_id

  // Create collector session
  const collectorCookie = buildCollectorSessionCookie({
    shopifyCustomerId: shopifyCustomerId ? shopifyCustomerId.toString() : null,
    email,
    collectorIdentifier: null,
    impersonated: false,
    issuedAt: Date.now(),
  })

  const response = NextResponse.json({ success: true })
  response.cookies.set(collectorCookie.name, collectorCookie.value, collectorCookie.options)
  
  if (shopifyCustomerId) {
    response.cookies.set("shopify_customer_id", shopifyCustomerId.toString(), {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24,
    })
  }

  // Keep vendor session intact (don't clear it)
  console.log(`[vendor-switch-collector] Vendor ${vendorName} switched to collector`)
  return response
}
