import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { buildCollectorSessionCookie } from "@/lib/collector-session"
import { REQUIRE_ACCOUNT_SELECTION_COOKIE } from "@/lib/vendor-auth"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are required for collector Google callback")
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin
  const finalRedirectBase = appUrl.replace(/\/$/, "")
  const code = searchParams.get("code")
  const redirectParam = searchParams.get("redirect") || "/collector/dashboard"

  if (!code) {
    return NextResponse.redirect(new URL(`/login?error=missing_code`, finalRedirectBase))
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession({
    code,
    redirectTo: `${finalRedirectBase}/auth/collector/callback`,
  })

  if (error || !data.session?.user?.email) {
    console.error("[collector-google-callback] exchange failed", error)
    return NextResponse.redirect(new URL(`/login?error=oauth_failed`, finalRedirectBase))
  }

  const email = data.session.user.email.toLowerCase()

  // Find a matching Shopify customer via orders email or collector profile
  const serviceClient = createServiceClient()
  const { data: orderMatch, error: orderError } = await serviceClient
    .from("orders")
    .select("customer_id, shopify_id")
    .eq("customer_email", email)
    .order("processed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (orderError) {
    console.error("[collector-google-callback] order lookup failed", orderError)
    return NextResponse.redirect(new URL(`/login?error=lookup_failed`, finalRedirectBase))
  }

  // Also check collector_profiles table
  const { data: profileMatch, error: profileError } = await serviceClient
    .from("collector_profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (profileError) {
    console.error("[collector-google-callback] profile lookup failed", profileError)
  }

  const shopifyCustomerId = orderMatch?.customer_id || orderMatch?.shopify_id
  
  // If no order or profile match found, they can't log in as a collector
  if (!orderMatch && !profileMatch) {
    console.log(`[collector-google-callback] No collector access for email: ${email}`)
    return NextResponse.redirect(new URL(`/login?error=no_collector_profile`, finalRedirectBase))
  }

  const collectorCookie = buildCollectorSessionCookie({
    shopifyCustomerId: shopifyCustomerId ? shopifyCustomerId.toString() : null,
    email,
    collectorIdentifier: null,
    impersonated: false,
    issuedAt: Date.now(),
  })

  const response = NextResponse.redirect(new URL(redirectParam, finalRedirectBase))
  response.cookies.set(collectorCookie.name, collectorCookie.value, collectorCookie.options)
  
  if (shopifyCustomerId) {
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
    response.cookies.set(shopifyCookie.name, shopifyCookie.value, shopifyCookie.options)
  }
  
  // Clear account selection requirement after successful login
  response.cookies.set(REQUIRE_ACCOUNT_SELECTION_COOKIE, "", { path: "/", maxAge: 0 })

  console.log(`[collector-google-callback] Collector login successful for ${email}`)
  return response
}

