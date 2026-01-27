/**
 * Unified OAuth Callback Handler (RBAC v2)
 * 
 * Consolidated callback route that handles:
 * - Google OAuth (vendor/admin/collector)
 * - Role-based redirects using unified user_roles system
 * - JWT-based session management (no custom cookies)
 * 
 * This replaces the fragmented callback routes:
 * - /auth/callback (main)
 * - /auth/collector/callback
 * - /auth/admin/callback
 * - /api/auth/shopify/google/callback
 * 
 * @module app/auth/callback
 */

import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { getUserContext } from "@/lib/rbac"
import {
  getDefaultRole,
  getDashboardForRole,
  setActiveRole,
  redirectToDashboard,
  needsRoleSelection,
  redirectToRoleSelection,
} from "@/lib/rbac/session"
import { syncInstagramHistory } from "@/lib/crm/instagram-helper"
import { syncGmailForUser } from "@/lib/crm/sync-gmail-helper"
import { logFailedLoginAttempt } from "@/lib/audit-logger"

// ============================================
// Constants
// ============================================

const POST_LOGIN_REDIRECT_COOKIE = "post_login_redirect"
const REQUIRE_ACCOUNT_SELECTION_COOKIE = "require_account_selection"

// ============================================
// Helper Functions
// ============================================

/**
 * Validate origin URL to prevent open redirects
 */
function validateOrigin(origin: string | null): string {
  if (!origin) {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  }

  try {
    const url = new URL(origin)
    const allowedHosts = [
      "localhost",
      "127.0.0.1",
      "thestreetcollector.com",
      "app.thestreetcollector.com",
      "street-collector.vercel.app",
      "streetcollector.vercel.app",
    ]

    const hostname = url.hostname
    if (allowedHosts.includes(hostname) || hostname.endsWith(".vercel.app")) {
      return origin
    }

    console.warn(`[auth/callback] Invalid origin: ${origin}, using default`)
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  } catch {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  }
}

/**
 * Get post-login redirect URL from cookie
 */
function getPostLoginRedirect(cookieStore: ReturnType<typeof cookies>): string | null {
  const cookie = cookieStore.get(POST_LOGIN_REDIRECT_COOKIE)
  return cookie?.value || null
}

/**
 * Clear post-login redirect cookie
 */
function clearPostLoginRedirect(response: NextResponse): void {
  response.cookies.set(POST_LOGIN_REDIRECT_COOKIE, "", { path: "/", maxAge: 0 })
}

/**
 * Sync external services for user (Gmail, Instagram)
 */
async function syncExternalServices(
  userId: string,
  email: string,
  providerToken?: string,
  providerRefreshToken?: string
): Promise<void> {
  try {
    // Sync Gmail if provider tokens are available
    if (providerToken && providerRefreshToken) {
      console.log(`[auth/callback] Syncing Gmail for ${email}`)
      await syncGmailForUser(userId, email, providerToken, providerRefreshToken)
    }

    // Sync Instagram history (runs in background)
    console.log(`[auth/callback] Syncing Instagram for ${email}`)
    await syncInstagramHistory(email)
  } catch (error) {
    console.error(`[auth/callback] Error syncing external services:`, error)
    // Don't fail the login if external sync fails
  }
}

// ============================================
// Main Callback Handler
// ============================================

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")
  const origin = validateOrigin(requestUrl.origin)

  console.log(`[auth/callback] Processing callback - code: ${!!code}, error: ${error}`)

  // Handle OAuth errors
  if (error) {
    console.error(`[auth/callback] OAuth error: ${error} - ${errorDescription}`)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, origin),
      { status: 307 }
    )
  }

  // Require authorization code
  if (!code) {
    console.error(`[auth/callback] No authorization code provided`)
    return NextResponse.redirect(
      new URL("/login?error=no_code", origin),
      { status: 307 }
    )
  }

  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error(`[auth/callback] Code exchange failed:`, exchangeError)
      await logFailedLoginAttempt("unknown", "code_exchange_failed", exchangeError.message)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("Authentication failed. Please try again.")}`, origin),
        { status: 307 }
      )
    }

    const { session, user } = data

    if (!session || !user) {
      console.error(`[auth/callback] No session/user after code exchange`)
      return NextResponse.redirect(
        new URL("/login?error=no_session", origin),
        { status: 307 }
      )
    }

    console.log(`[auth/callback] Authentication successful for user: ${user.email}`)

    // Get user context from JWT (roles and permissions)
    const userContext = await getUserContext(supabase)

    if (!userContext || userContext.roles.length === 0) {
      console.error(`[auth/callback] User has no roles: ${user.email}`)
      
      // User is authenticated but has no roles - this could be a new user
      // that needs to be set up, or an error in migration
      return NextResponse.redirect(
        new URL("/login?error=no_roles", origin),
        { status: 307 }
      )
    }

    console.log(
      `[auth/callback] User has roles: ${userContext.roles.join(", ")} (vendorId: ${userContext.vendorId})`
    )

    // Sync external services in background
    const providerToken = session.provider_token
    const providerRefreshToken = session.provider_refresh_token
    syncExternalServices(user.id, user.email || "", providerToken, providerRefreshToken)

    // Check for post-login redirect
    const postLoginRedirect = getPostLoginRedirect(cookieStore)

    // Check if user needs role selection (has multiple roles and no preference)
    if (needsRoleSelection(request, userContext)) {
      console.log(`[auth/callback] User has multiple roles, redirecting to role selection`)
      const response = redirectToRoleSelection(request)
      if (postLoginRedirect) {
        clearPostLoginRedirect(response)
      }
      return response
    }

    // Get default role (highest privilege)
    const defaultRole = getDefaultRole(userContext)
    console.log(`[auth/callback] Using default role: ${defaultRole}`)

    // Check if we have a post-login redirect
    if (postLoginRedirect) {
      console.log(`[auth/callback] Post-login redirect to: ${postLoginRedirect}`)
      const response = NextResponse.redirect(new URL(postLoginRedirect, origin), { status: 307 })
      setActiveRole(response, defaultRole)
      clearPostLoginRedirect(response)
      return response
    }

    // Redirect to appropriate dashboard
    console.log(`[auth/callback] Redirecting to ${defaultRole} dashboard`)
    const response = redirectToDashboard(request, userContext)
    return response

  } catch (error: any) {
    console.error(`[auth/callback] Unexpected error:`, error)
    
    // Log failed attempt if we have an email
    try {
      const email = error?.email || "unknown"
      await logFailedLoginAttempt(email, "callback_error", error.message)
    } catch (logError) {
      console.error(`[auth/callback] Failed to log error:`, logError)
    }

    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("An unexpected error occurred. Please try again.")}`, origin),
      { status: 307 }
    )
  }
}

// ============================================
// Exports
// ============================================

// Support both GET and POST methods
export { GET as POST }
