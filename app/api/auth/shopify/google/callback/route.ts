import { NextRequest, NextResponse } from "next/server"
import { buildCollectorSessionCookie, clearCollectorSessionCookie } from "@/lib/collector-session"

/**
 * Handles Shopify Google login callback.
 * Expects Shopify to supply customer_id (and optionally customer_access_token, email).
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const state = searchParams.get("state")
  const customerId = searchParams.get("customer_id")
  const customerAccessToken = searchParams.get("customer_access_token")
  const email = searchParams.get("email") // Not always provided by Shopify

  const storedState = request.cookies.get("shopify_oauth_state")?.value
  const isDevelopment = process.env.NODE_ENV === "development"

  if (!isDevelopment && (!state || !storedState || state !== storedState)) {
    console.error("[shopify-google-callback] state validation failed", { state, storedState })
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 })
  }

  try {
    if (!customerId) {
      console.error("[shopify-google-callback] missing customer_id")
      return NextResponse.redirect(new URL("/login?error=missing_customer", request.url))
    }

    const cookieDomain = process.env.NODE_ENV === "production" ? ".thestreetlamp.com" : undefined

    // Build collector session to keep dashboard data fetching consistent
    const collectorCookie = buildCollectorSessionCookie(
      {
        shopifyCustomerId: customerId.toString(),
        email: email ? email.toLowerCase() : null,
        collectorIdentifier: null,
        impersonated: false,
        issuedAt: Date.now(),
      },
      { domain: cookieDomain },
    )

    const response = NextResponse.redirect(new URL("/collector/dashboard", request.url))

    response.cookies.set("shopify_customer_id", customerId.toString(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      domain: cookieDomain,
    })

    if (customerAccessToken) {
      response.cookies.set("shopify_customer_access_token", customerAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        domain: cookieDomain,
      })
    }

    response.cookies.set("shopify_customer_login", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      domain: cookieDomain,
    })

    response.cookies.set(collectorCookie.name, collectorCookie.value, collectorCookie.options)

    response.cookies.delete("shopify_oauth_state")
    response.cookies.set(clearCollectorSessionCookie().name, "", clearCollectorSessionCookie().options)

    return response
  } catch (error) {
    console.error("[shopify-google-callback] error", error)
    return NextResponse.json(
      { error: "Authentication failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

