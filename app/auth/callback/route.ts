import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { buildVendorSessionCookie, VENDOR_SESSION_COOKIE_NAME } from "@/lib/vendor-session"
import {
  linkSupabaseUserToVendor,
  isAdminEmail,
  POST_LOGIN_REDIRECT_COOKIE,
  PENDING_VENDOR_EMAIL_COOKIE,
  sanitizeRedirectTarget,
} from "@/lib/vendor-auth"

const DEFAULT_VENDOR_REDIRECT = "/vendor/dashboard"
const ONBOARDING_REDIRECT = "/vendor/onboarding"
const ADMIN_REDIRECT = "/vendor/login?admin=1"

const deleteCookie = (response: NextResponse, name: string) => {
  response.cookies.set(name, "", { path: "/", maxAge: 0 })
}

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)

  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const redirectTarget = sanitizeRedirectTarget(
    cookieStore.get(POST_LOGIN_REDIRECT_COOKIE)?.value,
    origin,
    DEFAULT_VENDOR_REDIRECT,
  )

  const response = NextResponse.redirect(new URL(DEFAULT_VENDOR_REDIRECT, origin))

  deleteCookie(response, POST_LOGIN_REDIRECT_COOKIE)

  if (!code) {
    deleteCookie(response, VENDOR_SESSION_COOKIE_NAME)
    response.cookies.set("auth_error", "missing_code", { path: "/", maxAge: 60 })
    return response
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error("Failed to exchange Supabase auth code:", exchangeError)
    deleteCookie(response, VENDOR_SESSION_COOKIE_NAME)
    response.cookies.set("auth_error", "exchange_failed", { path: "/", maxAge: 60 })
    response.headers.set("Location", new URL("/vendor/login?error=oauth_exchange_failed", origin).toString())
    return response
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    console.error("Unable to fetch Supabase session after exchange:", sessionError)
    deleteCookie(response, VENDOR_SESSION_COOKIE_NAME)
    response.headers.set("Location", new URL("/vendor/login?error=session_missing", origin).toString())
    return response
  }

  const user = session.user
  const email = user.email?.toLowerCase() ?? null
  const vendor = await linkSupabaseUserToVendor(user)

  deleteCookie(response, PENDING_VENDOR_EMAIL_COOKIE)

  if (vendor) {
    const sessionCookie = buildVendorSessionCookie(vendor.vendor_name)
    response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options)
    response.headers.set(
      "Location",
      new URL(redirectTarget || DEFAULT_VENDOR_REDIRECT, origin).toString(),
    )
    return response
  }

  // No vendor linked – route admins to impersonation flow or vendors to onboarding.
  deleteCookie(response, VENDOR_SESSION_COOKIE_NAME)

  if (email) {
    response.cookies.set(PENDING_VENDOR_EMAIL_COOKIE, email, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10,
    })
  }

  const nextPath = isAdminEmail(email) ? ADMIN_REDIRECT : ONBOARDING_REDIRECT
  response.headers.set("Location", new URL(nextPath, origin).toString())

  return response
} 