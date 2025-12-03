import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { buildVendorSessionCookie, clearVendorSessionCookie, VENDOR_SESSION_COOKIE_NAME } from "@/lib/vendor-session"
import {
  linkSupabaseUserToVendor,
  isAdminEmail,
  POST_LOGIN_REDIRECT_COOKIE,
  PENDING_VENDOR_EMAIL_COOKIE,
  REQUIRE_ACCOUNT_SELECTION_COOKIE,
} from "@/lib/vendor-auth"
import {
  buildAdminSessionCookie,
  clearAdminSessionCookie,
  ADMIN_SESSION_COOKIE_NAME,
} from "@/lib/admin-session"
import { logFailedLoginAttempt } from "@/lib/audit-logger"
import { createClient as createServiceClient } from "@/lib/supabase/server"

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
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("Failed to exchange Supabase auth code:", exchangeError)
      deleteCookie(response, VENDOR_SESSION_COOKIE_NAME)
      response.cookies.set("auth_error", "exchange_failed", { path: "/", maxAge: 60 })
      await logFailedLoginAttempt({ method: "oauth", reason: exchangeError.message })
      response.headers.set("Location", new URL("/vendor/login?error=oauth_exchange_failed", origin).toString())
      return response
    }

    // After code exchange, immediately get the session to capture provider tokens
    // Provider tokens are only available right after exchange, not in subsequent getSession() calls
    if (sessionData?.session) {
      const providerToken = (sessionData.session as any).provider_token as string | undefined
      const providerRefreshToken = (sessionData.session as any).provider_refresh_token as string | undefined
      
      console.log('[auth/callback] Provider tokens after exchange:', {
        hasProviderToken: !!providerToken,
        hasRefreshToken: !!providerRefreshToken,
        tokenLength: providerToken?.length || 0,
        refreshTokenLength: providerRefreshToken?.length || 0,
      })
      
      // Store provider tokens in user metadata for Gmail access
      if ((providerToken && providerToken.trim()) || (providerRefreshToken && providerRefreshToken.trim())) {
        console.log('[auth/callback] Storing provider tokens in user metadata')
        const userId = sessionData.session.user.id
        
        try {
          const serviceSupabase = createServiceClient()
          
          // Get existing metadata to merge
          const { data: existingUser } = await serviceSupabase.auth.admin.getUserById(userId)
          const existingMetadata = existingUser?.user?.app_metadata || {}
          
          const metadataUpdate: any = { ...existingMetadata }
          if (providerToken && providerToken.trim()) {
            metadataUpdate.provider_token = providerToken
          }
          if (providerRefreshToken && providerRefreshToken.trim()) {
            metadataUpdate.provider_refresh_token = providerRefreshToken
          }
          
          const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(
            userId,
            { app_metadata: metadataUpdate }
          )
          
          if (updateError) {
            console.error('[auth/callback] Failed to store provider tokens:', updateError)
          } else {
            console.log('[auth/callback] Successfully stored provider tokens in user metadata')
          }
        } catch (error) {
          console.error('[auth/callback] Error storing provider tokens:', error)
        }
      }
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

  // Get user from session (already exchanged above if code was present)
  const user = session.user
  const email = user.email?.toLowerCase() ?? null
  const isAdmin = isAdminEmail(email)
  
  console.log(`[auth/callback] Processing login for email: ${email}, isAdmin: ${isAdmin}`)

  // This should not happen if code path above worked correctly
  // But handle it as fallback
  if (isAdmin && email) {
    console.log(`[auth/callback] Admin user detected in vendor auth flow (fallback) - redirecting to admin login`)
    const adminLoginRedirect = NextResponse.redirect(new URL("/admin-login?error=use_admin_login", origin), { status: 307 })
    deleteCookie(adminLoginRedirect, VENDOR_SESSION_COOKIE_NAME)
    deleteCookie(adminLoginRedirect, PENDING_VENDOR_EMAIL_COOKIE)
    await supabase.auth.signOut()
    return adminLoginRedirect
  }

  // For non-admins, try to link vendor
  const vendor = await linkSupabaseUserToVendor(user)
  
  console.log(`[auth/callback] Vendor linking result: ${vendor ? `${vendor.vendor_name} (status: ${vendor.status})` : "null"}`)

  // PENDING_VENDOR_EMAIL_COOKIE will be deleted in the redirect response

  // If vendor is linked, set vendor session and redirect to vendor dashboard
  if (vendor) {
    console.log(`[auth/callback] Vendor linked: ${vendor.vendor_name}, status: ${vendor.status}, email: ${email}`)
    const sessionCookie = buildVendorSessionCookie(vendor.vendor_name)
    
    // Determine redirect destination
    let destination = DEFAULT_VENDOR_REDIRECT
    if (vendor.status && vendor.status !== "active") {
      if (vendor.status === "pending" || vendor.status === "review") {
        destination = PENDING_VENDOR_REDIRECT
      } else if (vendor.status === "disabled" || vendor.status === "suspended") {
        destination = DENIED_VENDOR_REDIRECT
      }
    }
    // Don't redirect for incomplete onboarding - contextual onboarding will handle it

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
    
    // Clear account selection requirement flag after successful login
    deleteCookie(redirectResponse, REQUIRE_ACCOUNT_SELECTION_COOKIE)
    
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