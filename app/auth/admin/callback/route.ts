import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import {
  buildAdminSessionCookie,
  clearAdminSessionCookie,
  ADMIN_SESSION_COOKIE_NAME,
} from "@/lib/admin-session"
import { isAdminEmail } from "@/lib/vendor-auth"
import { clearVendorSessionCookie } from "@/lib/vendor-session"

const ADMIN_DASHBOARD_REDIRECT = "/admin/dashboard"

/**
 * Helper function to store provider tokens in user metadata
 */
async function storeProviderTokens(
  userId: string,
  providerToken: string | undefined,
  providerRefreshToken: string | undefined
) {
  if ((providerToken && providerToken.trim()) || (providerRefreshToken && providerRefreshToken.trim())) {
    console.log("[auth/admin/callback] Storing provider tokens in user metadata")
    
    try {
      const serviceSupabase = createServiceClient()
      
      // Get existing metadata to merge
      const { data: existingUser } = await serviceSupabase.auth.admin.getUserById(userId)
      const existingMetadata = existingUser?.user?.app_metadata || {}
      
      const metadataUpdate: any = { ...existingMetadata }
      if (providerToken && providerToken.trim()) {
        metadataUpdate.provider_token = providerToken
        console.log("[auth/admin/callback] Stored provider_token")
      }
      if (providerRefreshToken && providerRefreshToken.trim()) {
        metadataUpdate.provider_refresh_token = providerRefreshToken
        console.log("[auth/admin/callback] Stored provider_refresh_token")
      }
      
      const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(
        userId,
        { app_metadata: metadataUpdate }
      )
      
      if (updateError) {
        console.error("[auth/admin/callback] Failed to store provider tokens:", updateError)
      } else {
        console.log("[auth/admin/callback] Successfully stored provider tokens in user metadata")
      }
    } catch (error) {
      console.error("[auth/admin/callback] Error storing provider tokens:", error)
    }
  } else {
    console.warn("[auth/admin/callback] No provider tokens found in session - Gmail sync may not work")
  }
}

/**
 * Admin OAuth callback - dedicated handler for admin authentication
 * Captures and stores Gmail provider tokens for CRM email sync
 */
export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const accessToken = searchParams.get("access_token")
  const refreshToken = searchParams.get("refresh_token")

  // Get redirect destination
  const redirectParam = cookieStore.get("admin_post_login_redirect")?.value || ADMIN_DASHBOARD_REDIRECT
  const redirectUrl = new URL(redirectParam, origin)

  // Check if this is a redirect from vendor auth (session already exists)
  const fromVendorAuth = searchParams.get("from_vendor_auth") === "true"
  
  // Check for error from Supabase
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")
  
  if (error) {
    console.error("[auth/admin/callback] OAuth error from Supabase:", error, errorDescription)
    const errorResponse = NextResponse.redirect(
      new URL(`/admin-login?error=oauth_error&message=${encodeURIComponent(errorDescription || error)}`, origin),
      { status: 307 }
    )
    errorResponse.cookies.set("admin_post_login_redirect", "", { path: "/", maxAge: 0 })
    return errorResponse
  }
  
  // Handle token-based redirect (Supabase redirects with tokens instead of code)
  if (accessToken && refreshToken && !code) {
    console.log("[auth/admin/callback] Handling token-based redirect from Supabase")
    
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (sessionError) {
      console.error("[auth/admin/callback] Failed to establish session from tokens:", sessionError)
      const errorResponse = NextResponse.redirect(new URL("/admin-login?error=session_missing", origin), { status: 307 })
      errorResponse.cookies.set("admin_post_login_redirect", "", { path: "/", maxAge: 0 })
      return errorResponse
    }
    
    // Get session after setting it
    const { data: { session: tokenSession } } = await supabase.auth.getSession()
    if (!tokenSession?.user) {
      const errorResponse = NextResponse.redirect(new URL("/admin-login?error=no_session", origin), { status: 307 })
      errorResponse.cookies.set("admin_post_login_redirect", "", { path: "/", maxAge: 0 })
      return errorResponse
    }
    
    const user = tokenSession.user
    const email = user.email?.toLowerCase()
    
    if (!email || !isAdminEmail(email)) {
      console.error(`[auth/admin/callback] Non-admin user attempted admin login: ${email}`)
      const errorResponse = NextResponse.redirect(new URL("/admin-login?error=not_admin", origin), { status: 307 })
      errorResponse.cookies.set("admin_post_login_redirect", "", { path: "/", maxAge: 0 })
      return errorResponse
    }
    
    // Get provider tokens from URL params (Supabase passes them in token-based redirects)
    const providerToken = searchParams.get("provider_token") || undefined
    const providerRefreshToken = searchParams.get("provider_refresh_token") || undefined
    
    console.log("[auth/admin/callback] Provider tokens from token redirect:", {
      hasProviderToken: !!providerToken,
      hasRefreshToken: !!providerRefreshToken,
      tokenLength: providerToken?.length || 0,
      refreshTokenLength: providerRefreshToken?.length || 0,
    })
    
    // Store provider tokens
    await storeProviderTokens(user.id, providerToken, providerRefreshToken)
    
    // Build admin session cookie
    const adminCookie = buildAdminSessionCookie(email)
    const response = NextResponse.redirect(redirectUrl, { status: 307 })
    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, adminCookie.value, adminCookie.options)
    response.cookies.set("admin_post_login_redirect", "", { path: "/", maxAge: 0 })
    
    console.log(`[auth/admin/callback] Admin login successful from tokens for ${email}`)
    return response
  }
  
  // Handle token-based redirect (Supabase redirects with tokens instead of code)
  // This happens when Supabase uses implicit flow or when redirect URL is not in allowed list
  if (accessToken && refreshToken && !code) {
    console.log("[auth/admin/callback] Handling token-based redirect from Supabase")
    
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (sessionError) {
      console.error("[auth/admin/callback] Failed to establish session from tokens:", sessionError)
      const errorResponse = NextResponse.redirect(new URL("/admin-login?error=session_missing", origin), { status: 307 })
      errorResponse.cookies.set("admin_post_login_redirect", "", { path: "/", maxAge: 0 })
      return errorResponse
    }
    
    // Get session after setting it
    const { data: { session: tokenSession } } = await supabase.auth.getSession()
    if (!tokenSession?.user) {
      const errorResponse = NextResponse.redirect(new URL("/admin-login?error=no_session", origin), { status: 307 })
      errorResponse.cookies.set("admin_post_login_redirect", "", { path: "/", maxAge: 0 })
      return errorResponse
    }
    
    const user = tokenSession.user
    const email = user.email?.toLowerCase()
    
    if (!email || !isAdminEmail(email)) {
      console.error(`[auth/admin/callback] Non-admin user attempted admin login: ${email}`)
      const errorResponse = NextResponse.redirect(new URL("/admin-login?error=not_admin", origin), { status: 307 })
      errorResponse.cookies.set("admin_post_login_redirect", "", { path: "/", maxAge: 0 })
      return errorResponse
    }
    
    // Get provider tokens from URL params (Supabase passes them in token-based redirects)
    const providerToken = searchParams.get("provider_token") || undefined
    const providerRefreshToken = searchParams.get("provider_refresh_token") || undefined
    
    console.log("[auth/admin/callback] Provider tokens from token redirect:", {
      hasProviderToken: !!providerToken,
      hasRefreshToken: !!providerRefreshToken,
      tokenLength: providerToken?.length || 0,
      refreshTokenLength: providerRefreshToken?.length || 0,
    })
    
    // Store provider tokens
    await storeProviderTokens(user.id, providerToken, providerRefreshToken)
    
    // Build admin session cookie
    const adminCookie = buildAdminSessionCookie(email)
    const response = NextResponse.redirect(redirectUrl, { status: 307 })
    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, adminCookie.value, adminCookie.options)
    response.cookies.set("admin_post_login_redirect", "", { path: "/", maxAge: 0 })
    
    console.log(`[auth/admin/callback] Admin login successful from tokens for ${email}`)
    return response
  }
  
  if (!code && !fromVendorAuth) {
    console.error("[auth/admin/callback] Missing OAuth code and not from vendor auth")
    console.log("[auth/admin/callback] Search params:", Object.fromEntries(searchParams))
    console.log("[auth/admin/callback] Full URL:", request.url)
    console.log("[auth/admin/callback] Origin:", origin)
    console.log("[auth/admin/callback] Expected redirect URL:", `${origin}/auth/admin/callback`)
    
    // Check if there's an error_description that might give us more info
    const errorDesc = searchParams.get("error_description")
    const errorCode = searchParams.get("error")
    
    if (errorDesc || errorCode) {
      console.error("[auth/admin/callback] Supabase error:", {
        error: errorCode,
        error_description: errorDesc,
      })
      // If Supabase provided an error, show it to the user
      const errorResponse = NextResponse.redirect(
        new URL(`/admin-login?error=supabase_error&message=${encodeURIComponent(errorDesc || errorCode || "Unknown error")}`, origin),
        { status: 307 }
      )
      errorResponse.cookies.set("admin_post_login_redirect", "", { path: "/", maxAge: 0 })
      return errorResponse
    }
    
    // This usually means Supabase didn't redirect with the code
    // Most likely cause: redirect URL not in Supabase's allowed list
    // OR: Supabase rejected the redirect for another reason
    // Since vendor login works, this is likely a formatting issue with the admin URL
    console.error("[auth/admin/callback] No error from Supabase, but no code either.")
    console.error("[auth/admin/callback] This suggests the redirect URL might have a formatting issue.")
    console.error("[auth/admin/callback] Please verify in Supabase Dashboard that the URL matches EXACTLY:")
    console.error(`[auth/admin/callback]   "${origin}/auth/admin/callback"`)
    console.error("[auth/admin/callback] Check for: trailing slashes, extra spaces, wrong protocol")
    
    const errorResponse = NextResponse.redirect(
      new URL(`/admin-login?error=missing_code&hint=formatting_issue&expected=${encodeURIComponent(`${origin}/auth/admin/callback`)}`, origin),
      { status: 307 }
    )
    errorResponse.cookies.set("admin_post_login_redirect", "", { path: "/", maxAge: 0 })
    return errorResponse
  }

  // If coming from vendor auth, we already have a session - use it
  if (fromVendorAuth && !code) {
    console.log("[auth/admin/callback] Handling redirect from vendor auth - using existing session")
    const { data: { session: existingSession } } = await supabase.auth.getSession()
    
    if (!existingSession?.user) {
      console.error("[auth/admin/callback] No existing session from vendor auth")
      const errorResponse = NextResponse.redirect(new URL("/admin-login?error=no_session", origin), { status: 307 })
      errorResponse.cookies.set("admin_post_login_redirect", "", { path: "/", maxAge: 0 })
      return errorResponse
    }
    
    const user = existingSession.user
    const email = user.email?.toLowerCase()
    
    if (!email || !isAdminEmail(email)) {
      console.error(`[auth/admin/callback] User from vendor auth is not admin: ${email}`)
      const errorResponse = NextResponse.redirect(new URL("/admin-login?error=not_admin", origin), { status: 307 })
      errorResponse.cookies.set("admin_post_login_redirect", "", { path: "/", maxAge: 0 })
      return errorResponse
    }
    
    // Get provider tokens from existing session
    const providerToken = (existingSession as any).provider_token as string | undefined
    const providerRefreshToken = (existingSession as any).provider_refresh_token as string | undefined
    
    console.log("[auth/admin/callback] Provider tokens from existing session:", {
      hasProviderToken: !!providerToken,
      hasRefreshToken: !!providerRefreshToken,
      tokenLength: providerToken?.length || 0,
      refreshTokenLength: providerRefreshToken?.length || 0,
    })
    
    // Store provider tokens
    await storeProviderTokens(user.id, providerToken, providerRefreshToken)
    
    // Build admin session cookie
    const adminCookie = buildAdminSessionCookie(email)
    const response = NextResponse.redirect(redirectUrl, { status: 307 })
    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, adminCookie.value, adminCookie.options)
    response.cookies.set("admin_post_login_redirect", "", { path: "/", maxAge: 0 })
    
    console.log(`[auth/admin/callback] Admin login successful from vendor auth for ${email}`)
    return response
  }

  // Exchange code for session
  const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error("[auth/admin/callback] Failed to exchange code:", exchangeError)
    const errorResponse = NextResponse.redirect(new URL("/admin-login?error=exchange_failed", origin), { status: 307 })
    errorResponse.cookies.set("admin_post_login_redirect", "", { path: "/", maxAge: 0 })
    return errorResponse
  }

  if (!sessionData?.session?.user) {
    console.error("[auth/admin/callback] No session or user after exchange")
    const errorResponse = NextResponse.redirect(new URL("/admin-login?error=no_session", origin), { status: 307 })
    errorResponse.cookies.set("admin_post_login_redirect", "", { path: "/", maxAge: 0 })
    return errorResponse
  }

  const user = sessionData.session.user
  const email = user.email?.toLowerCase()

  if (!email || !isAdminEmail(email)) {
    console.error(`[auth/admin/callback] Non-admin user attempted admin login: ${email}`)
    const errorResponse = NextResponse.redirect(new URL("/admin-login?error=not_admin", origin), { status: 307 })
    errorResponse.cookies.set("admin_post_login_redirect", "", { path: "/", maxAge: 0 })
    return errorResponse
  }

  // CRITICAL: Capture provider tokens immediately after exchange
  // They're only available in the session response, not in subsequent getSession() calls
  const providerToken = (sessionData.session as any).provider_token as string | undefined
  const providerRefreshToken = (sessionData.session as any).provider_refresh_token as string | undefined

  console.log("[auth/admin/callback] Provider tokens after exchange:", {
    hasProviderToken: !!providerToken,
    hasRefreshToken: !!providerRefreshToken,
    tokenLength: providerToken?.length || 0,
    refreshTokenLength: providerRefreshToken?.length || 0,
    userId: user.id,
    email: email,
  })

  // Store provider tokens in user metadata for Gmail access
  await storeProviderTokens(user.id, providerToken, providerRefreshToken)

  // Build admin session cookie
  const adminCookie = buildAdminSessionCookie(email)
  const response = NextResponse.redirect(redirectUrl, { status: 307 })
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, adminCookie.value, adminCookie.options)
  
  // Clear vendor session cookie
  const clearVendorCookie = clearVendorSessionCookie()
  response.cookies.set(clearVendorCookie.name, "", { ...clearVendorCookie.options, maxAge: 0 })
  
  // Clear redirect cookie
  response.cookies.set("admin_post_login_redirect", "", { path: "/", maxAge: 0 })

  console.log(`[auth/admin/callback] Admin login successful for ${email}, redirecting to ${redirectParam}`)
  return response
}

