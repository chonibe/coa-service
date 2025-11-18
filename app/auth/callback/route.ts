import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { buildVendorSessionCookie, clearVendorSessionCookie, VENDOR_SESSION_COOKIE_NAME } from "@/lib/vendor-session"
import {
  linkSupabaseUserToVendor,
  isAdminEmail,
  POST_LOGIN_REDIRECT_COOKIE,
  PENDING_VENDOR_EMAIL_COOKIE,
} from "@/lib/vendor-auth"
import {
  buildAdminSessionCookie,
  clearAdminSessionCookie,
  ADMIN_SESSION_COOKIE_NAME,
} from "@/lib/admin-session"
import { logFailedLoginAttempt } from "@/lib/audit-logger"

const DEFAULT_VENDOR_REDIRECT = "/vendor/dashboard"
const NOT_REGISTERED_REDIRECT = "/login?error=not_registered"
const ADMIN_DASHBOARD_REDIRECT = "/admin/dashboard"
const PENDING_VENDOR_REDIRECT = "/vendor/access-pending"
const DENIED_VENDOR_REDIRECT = "/vendor/access-denied"

const deleteCookie = (response: NextResponse, name: string) => {
  response.cookies.set(name, "", { path: "/", maxAge: 0 })
}

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)

  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const accessToken = searchParams.get("access_token")
  const refreshToken = searchParams.get("refresh_token")

  const response = NextResponse.redirect(new URL(DEFAULT_VENDOR_REDIRECT, origin))

  deleteCookie(response, POST_LOGIN_REDIRECT_COOKIE)

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("Failed to exchange Supabase auth code:", exchangeError)
      deleteCookie(response, VENDOR_SESSION_COOKIE_NAME)
      response.cookies.set("auth_error", "exchange_failed", { path: "/", maxAge: 60 })
      await logFailedLoginAttempt({ method: "oauth", reason: exchangeError.message })
      response.headers.set("Location", new URL("/vendor/login?error=oauth_exchange_failed", origin).toString())
      return response
    }
  } else if (accessToken && refreshToken) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (sessionError) {
      console.error("Failed to establish Supabase session from tokens:", sessionError)
      deleteCookie(response, VENDOR_SESSION_COOKIE_NAME)
      await logFailedLoginAttempt({ method: "oauth", reason: sessionError.message })
      response.headers.set("Location", new URL("/vendor/login?error=session_missing", origin).toString())
      return response
    }
  } else {
    deleteCookie(response, VENDOR_SESSION_COOKIE_NAME)
    response.cookies.set("auth_error", "missing_code", { path: "/", maxAge: 60 })
    await logFailedLoginAttempt({ method: "oauth", reason: "Missing OAuth code" })
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
  const isAdmin = isAdminEmail(email)
  
  console.log(`[auth/callback] Processing login for email: ${email}, isAdmin: ${isAdmin}`)

  // For admins, skip vendor linking and go straight to admin dashboard
  if (isAdmin && email) {
    console.log(`[auth/callback] Admin user detected, setting admin session`)
    const adminCookie = buildAdminSessionCookie(email)
    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, adminCookie.value, adminCookie.options)
    const clearVendorCookie = clearVendorSessionCookie()
    response.cookies.set(clearVendorCookie.name, "", clearVendorCookie.options)
    deleteCookie(response, PENDING_VENDOR_EMAIL_COOKIE)
    response.headers.set("Location", new URL(ADMIN_DASHBOARD_REDIRECT, origin).toString())
    return response
  }

  // For non-admins, try to link vendor
  const vendor = await linkSupabaseUserToVendor(user)
  
  console.log(`[auth/callback] Vendor linking result: ${vendor ? `${vendor.vendor_name} (status: ${vendor.status})` : "null"}`)

  deleteCookie(response, PENDING_VENDOR_EMAIL_COOKIE)

  // If vendor is linked, set vendor session and redirect to vendor dashboard
  if (vendor) {
    console.log(`[auth/callback] Vendor linked: ${vendor.vendor_name}, status: ${vendor.status}, email: ${email}`)
    const sessionCookie = buildVendorSessionCookie(vendor.vendor_name)
    
    // Set cookie with explicit options to ensure it's set correctly
    response.cookies.set(sessionCookie.name, sessionCookie.value, {
      ...sessionCookie.options,
      // Ensure cookie is set for the current domain
      domain: undefined, // Let browser set domain automatically
    })
    
    console.log(`[auth/callback] Set vendor session cookie: ${sessionCookie.name} with options:`, {
      path: sessionCookie.options.path,
      httpOnly: sessionCookie.options.httpOnly,
      secure: sessionCookie.options.secure,
      sameSite: sessionCookie.options.sameSite,
      maxAge: sessionCookie.options.maxAge,
    })
    
    // Clear admin session cookie - vendor login should not have admin access
    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", clearAdminSessionCookie().options)
    
    // Always redirect vendors to vendor dashboard
    let destination = DEFAULT_VENDOR_REDIRECT
    if (vendor.status && vendor.status !== "active") {
      if (vendor.status === "pending" || vendor.status === "review") {
        destination = PENDING_VENDOR_REDIRECT
      } else if (vendor.status === "disabled" || vendor.status === "suspended") {
        destination = DENIED_VENDOR_REDIRECT
      }
    }

    console.log(`[auth/callback] Redirecting vendor to: ${destination}`)
    response.headers.set("Location", new URL(destination, origin).toString())
    return response
  }

  // No vendor linked and not admin – block unregistered vendors
  console.log(`[auth/callback] No vendor linked for email: ${email}`)
  deleteCookie(response, VENDOR_SESSION_COOKIE_NAME)

  await supabase.auth.signOut()
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", clearAdminSessionCookie().options)
  await logFailedLoginAttempt({
    email,
    method: "oauth",
    reason: "No vendor linked for non-admin user",
  })
  response.headers.set("Location", new URL(NOT_REGISTERED_REDIRECT, origin).toString())

  return response
} 