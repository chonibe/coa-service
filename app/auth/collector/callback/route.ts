import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { buildCollectorSessionCookie, clearCollectorSessionCookie } from "@/lib/collector-session"

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
  const code = searchParams.get("code")
  const redirectParam = searchParams.get("redirect") || "/collector/dashboard"

  if (!code) {
    return NextResponse.redirect(new URL(`/login?error=missing_code`, origin))
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession({
    code,
    redirectTo: `${origin}/auth/collector/callback`,
  })

  if (error || !data.session?.user?.email) {
    console.error("[collector-google-callback] exchange failed", error)
    return NextResponse.redirect(new URL(`/login?error=oauth_failed`, origin))
  }

  const email = data.session.user.email.toLowerCase()

  // Find a matching Shopify customer via orders email
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
    return NextResponse.redirect(new URL(`/login?error=lookup_failed`, origin))
  }

  const shopifyCustomerId = orderMatch?.customer_id || orderMatch?.shopify_id
  if (!shopifyCustomerId) {
    return NextResponse.redirect(new URL(`/login?error=no_collector_profile`, origin))
  }

  const collectorCookie = buildCollectorSessionCookie({
    shopifyCustomerId: shopifyCustomerId.toString(),
    email,
    collectorIdentifier: null,
    impersonated: false,
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

  const response = NextResponse.redirect(new URL(redirectParam, origin))
  response.cookies.set(collectorCookie.name, collectorCookie.value, collectorCookie.options)
  response.cookies.set(shopifyCookie.name, shopifyCookie.value, shopifyCookie.options)
  // Clear any stale collector session if present
  response.cookies.set(clearCollectorSessionCookie().name, "", clearCollectorSessionCookie().options)

  return response
}

