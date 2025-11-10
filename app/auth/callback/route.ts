import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { buildVendorSessionCookie, VENDOR_SESSION_COOKIE_NAME } from "@/lib/vendor-session"
import {
  linkVendorByKnownEmail,
  resolveVendorAuthState,
  POST_LOGIN_REDIRECT_COOKIE,
  PENDING_VENDOR_EMAIL_COOKIE,
  sanitizeRedirectTarget,
} from "@/lib/vendor-auth"

const DEFAULT_VENDOR_REDIRECT = "/vendor/dashboard"
const ADMIN_REDIRECT = "/vendor/login?tab=admin"

const deleteCookie = (response: NextResponse, name: string) => {
  response.cookies.set(name, "", { path: "/", maxAge: 0 })
}

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)

  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const storedRedirect = cookieStore.get(POST_LOGIN_REDIRECT_COOKIE)?.value
  const redirectTarget = sanitizeRedirectTarget(storedRedirect, origin, DEFAULT_VENDOR_REDIRECT)

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
  await linkVendorByKnownEmail(user)
  const resolution = await resolveVendorAuthState(user)

  deleteCookie(response, PENDING_VENDOR_EMAIL_COOKIE)

  if (resolution.status === "linked") {
    const vendor = resolution.vendor
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

  const email = user.email?.toLowerCase() ?? null

  if (email) {
    response.cookies.set(PENDING_VENDOR_EMAIL_COOKIE, email, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10,
    })
  }

  let nextPath = "/vendor/signup"
  if (resolution.status === "admin") {
    nextPath = redirectTarget !== DEFAULT_VENDOR_REDIRECT ? redirectTarget : ADMIN_REDIRECT
  } else if (resolution.status === "pending") {
    nextPath = "/vendor/signup?status=pending"
  }

  response.headers.set("Location", new URL(nextPath, origin).toString())

  return response
} 