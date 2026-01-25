import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-session"
import { buildCollectorSessionCookie } from "@/lib/collector-session"
import { createClient as createServiceClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  
  // Verify admin session
  const adminSessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const adminSession = verifyAdminSessionToken(adminSessionToken)

  if (!adminSession?.email) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Admin session required" },
      { status: 401 }
    )
  }

  const adminEmail = adminSession.email.toLowerCase()

  // Check if admin has collector orders
  const serviceClient = createServiceClient()
  const { data: orderMatch, error: orderError } = await serviceClient
    .from("orders")
    .select("customer_id, shopify_id")
    .eq("customer_email", adminEmail)
    .order("processed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (orderError) {
    console.error("[admin-switch-collector] order lookup failed", orderError)
    return NextResponse.json(
      { error: "Database error", message: "Failed to verify collector access" },
      { status: 500 }
    )
  }

  if (!orderMatch) {
    return NextResponse.json(
      { error: "No collector access", message: "Admin does not have collector orders" },
      { status: 403 }
    )
  }

  const shopifyCustomerId = orderMatch?.customer_id || orderMatch?.shopify_id

  // Create collector session
  const collectorCookie = buildCollectorSessionCookie({
    shopifyCustomerId: shopifyCustomerId ? shopifyCustomerId.toString() : null,
    email: adminEmail,
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

  // Keep admin session intact (don't clear it)
  return response
}
