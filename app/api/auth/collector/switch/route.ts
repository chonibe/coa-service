import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import {
  COLLECTOR_SESSION_COOKIE_NAME,
  buildCollectorSessionCookie,
  clearCollectorSessionCookie,
} from "@/lib/collector-session"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

// Allow a logged-in vendor to view their own collector profile (self-email only).
export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)
  if (!vendorName) {
    return NextResponse.json({ error: "Vendor session required" }, { status: 401 })
  }

  const supabase = createRouteClient(cookieStore)
  const serviceClient = createServiceClient()

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session?.user?.email) {
    return NextResponse.json({ error: "Vendor auth required" }, { status: 401 })
  }

  const email = session.user.email.toLowerCase()

  // Find a Shopify customer for this email via orders table (fastest path)
  const { data: orderMatch, error: orderError } = await serviceClient
    .from("orders")
    .select("customer_id, shopify_id")
    .eq("customer_email", email)
    .order("processed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (orderError) {
    console.error("[collector-switch] order lookup failed", orderError)
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 })
  }

  const shopifyCustomerId = orderMatch?.customer_id || orderMatch?.shopify_id
  if (!shopifyCustomerId) {
    return NextResponse.json({ error: "No matching collector profile for this email" }, { status: 404 })
  }

  // Build collector session cookie
  const collectorCookie = buildCollectorSessionCookie({
    shopifyCustomerId: shopifyCustomerId.toString(),
    email,
    collectorIdentifier: null,
    impersonated: true,
    issuedAt: Date.now(),
  })

  const shopifyCookie = {
    name: "shopify_customer_id",
    value: shopifyCustomerId.toString(),
    options: {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24,
    },
  }

  const response = NextResponse.json({ success: true, vendorName, shopifyCustomerId })
  response.cookies.set(collectorCookie.name, collectorCookie.value, collectorCookie.options)
  response.cookies.set(shopifyCookie.name, shopifyCookie.value, shopifyCookie.options)

  // Clear previous collector session if any, to avoid stale data (handled implicitly by overwrite)
  response.cookies.set(clearCollectorSessionCookie().name, "", clearCollectorSessionCookie().options)

  return response
}

