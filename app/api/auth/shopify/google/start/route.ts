import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

/**
 * Initiates Shopify customer login with Google identity provider.
 * Mirrors the existing Shopify auth flow so the experience feels identical.
 */
export async function GET(request: NextRequest) {
  try {
    const shopDomain =
      process.env.SHOPIFY_STORE_DOMAIN ||
      process.env.SHOPIFY_SHOP ||
      "thestreetlamp-9103.myshopify.com"
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    const state = crypto.randomBytes(16).toString("hex")
    const redirectBackUrl = `${appUrl}/api/auth/shopify/google/callback`
    const redirectParam = request.nextUrl.searchParams.get("redirect") || "/collector/dashboard"

    const loginUrl = new URL(`https://${shopDomain}/account/login`)
    const returnUrl = `https://${shopDomain}/pages/street-collector-auth?redirect_uri=${encodeURIComponent(
      redirectBackUrl,
    )}&state=${state}&redirect=${encodeURIComponent(redirectParam)}`
    loginUrl.searchParams.set("return_url", returnUrl)
    loginUrl.searchParams.set("identity_provider", "google")

    const response = NextResponse.redirect(loginUrl.toString())

    const postLoginRedirect = "/collector/dashboard"
    const cookieDomain = process.env.NODE_ENV === "production" ? ".thestreetlamp.com" : undefined

    response.cookies.set("shopify_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      domain: cookieDomain,
    })

    response.cookies.set("shopify_login_redirect", postLoginRedirect, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      domain: cookieDomain,
    })

    return response
  } catch (error) {
    console.error("Shopify Google Login Redirect Error:", error)
    return NextResponse.json(
      {
        error: "Failed to initiate Shopify Google login",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

