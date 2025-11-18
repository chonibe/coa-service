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

  // Create redirect response - we'll update the location after setting cookies
  const response = NextResponse.redirect(new URL(DEFAULT_VENDOR_REDIRECT, origin), { status: 307 })

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
    const errorResponse = NextResponse.redirect(new URL("/login?error=session_missing", origin), { status: 307 })
    deleteCookie(errorResponse, VENDOR_SESSION_COOKIE_NAME)
    return errorResponse
  }

  const user = session.user
  const email = user.email?.toLowerCase() ?? null
  const isAdmin = isAdminEmail(email)
  
  console.log(`[auth/callback] Processing login for email: ${email}, isAdmin: ${isAdmin}`)

  // For admins, skip vendor linking and go straight to admin dashboard
  if (isAdmin && email) {
    console.log(`[auth/callback] Admin user detected, setting admin session`)
    const adminRedirect = NextResponse.redirect(new URL(ADMIN_DASHBOARD_REDIRECT, origin), { status: 307 })
    const adminCookie = buildAdminSessionCookie(email)
    adminRedirect.cookies.set(ADMIN_SESSION_COOKIE_NAME, adminCookie.value, adminCookie.options)
    const clearVendorCookie = clearVendorSessionCookie()
    adminRedirect.cookies.set(clearVendorCookie.name, "", { ...clearVendorCookie.options, maxAge: 0 })
    deleteCookie(adminRedirect, PENDING_VENDOR_EMAIL_COOKIE)
    return adminRedirect
  }

  // For non-admins, try to link vendor
  const vendor = await linkSupabaseUserToVendor(user)
  
  console.log(`[auth/callback] Vendor linking result: ${vendor ? `${vendor.vendor_name} (status: ${vendor.status})` : "null"}`)

  // PENDING_VENDOR_EMAIL_COOKIE will be deleted in the redirect response

  // If vendor is linked, set vendor session and redirect to vendor dashboard
  if (vendor) {
    console.log(`[auth/callback] Vendor linked: ${vendor.vendor_name}, status: ${vendor.status}, email: ${email}`)
    const sessionCookie = buildVendorSessionCookie(vendor.vendor_name)
    
    // Always redirect vendors to vendor dashboard
    let destination = DEFAULT_VENDOR_REDIRECT
    if (vendor.status && vendor.status !== "active") {
      if (vendor.status === "pending" || vendor.status === "review") {
        destination = PENDING_VENDOR_REDIRECT
      } else if (vendor.status === "disabled" || vendor.status === "suspended") {
        destination = DENIED_VENDOR_REDIRECT
      }
    }

    // Create new redirect response with cookies set BEFORE redirect
    const redirectUrl = new URL(destination, origin)
    const redirectResponse = NextResponse.redirect(redirectUrl, { status: 307 })
    
    // Set cookie with explicit options to ensure it's set correctly
    // IMPORTANT: Set cookie on the redirect response, not the initial response
    redirectResponse.cookies.set(sessionCookie.name, sessionCookie.value, {
      ...sessionCookie.options,
    })
    
    console.log(`[auth/callback] Set vendor session cookie: ${sessionCookie.name} with options:`, {
      path: sessionCookie.options.path,
      httpOnly: sessionCookie.options.httpOnly,
      secure: sessionCookie.options.secure,
      sameSite: sessionCookie.options.sameSite,
      maxAge: sessionCookie.options.maxAge,
    })
    
    // Clear admin session cookie - vendor login should not have admin access
    redirectResponse.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
      ...clearAdminSessionCookie().options,
      maxAge: 0,
    })
    
    // Delete pending vendor email cookie
    deleteCookie(redirectResponse, PENDING_VENDOR_EMAIL_COOKIE)
    
    // Verify cookie was set
    const cookieValue = redirectResponse.cookies.get(sessionCookie.name)?.value
    console.log(`[auth/callback] Cookie set verification: ${cookieValue ? "SET" : "NOT SET"}`, {
      cookieName: sessionCookie.name,
      hasValue: !!cookieValue,
      cookieLength: cookieValue?.length || 0,
    })
    
    console.log(`[auth/callback] Redirecting vendor to: ${destination}`)
    return redirectResponse
  }

  // No vendor linked and not admin – block unregistered vendors
  console.log(`[auth/callback] No vendor linked for email: ${email}`)
  const notRegisteredResponse = NextResponse.redirect(new URL(NOT_REGISTERED_REDIRECT, origin), { status: 307 })
  deleteCookie(notRegisteredResponse, VENDOR_SESSION_COOKIE_NAME)

  await supabase.auth.signOut()
  notRegisteredResponse.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", { ...clearAdminSessionCookie().options, maxAge: 0 })
  await logFailedLoginAttempt({
    email,
    method: "oauth",
    reason: "No vendor linked for non-admin user",
  })

  return notRegisteredResponse
} 