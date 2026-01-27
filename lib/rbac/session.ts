/**
 * RBAC Session Management
 * 
 * Simplified session management using Supabase sessions with JWT claims.
 * Replaces the fragmented admin_session, vendor_session, and collector_session cookies.
 * 
 * @module lib/rbac/session
 */

import { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import type { Role, UserContext } from "./index"
import { getUserContextFromToken } from "./index"

// ============================================
// Constants
// ============================================

/**
 * Cookie name for storing user's preferred active role
 * This is just a UI preference, actual authorization uses JWT claims
 */
const ACTIVE_ROLE_COOKIE = "active_role"

/**
 * Cookie options for active role preference
 */
const ACTIVE_ROLE_COOKIE_OPTIONS: CookieOptions = {
  path: "/",
  httpOnly: false, // Allow client-side access for UI
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 30, // 30 days
}

// ============================================
// Active Role Management (UI Preference)
// ============================================

/**
 * Get user's preferred active role from cookie
 * This is a UI preference only - authorization still uses all roles from JWT
 * 
 * @param request - Next.js request object
 * @returns Active role or null if not set
 */
export function getActiveRole(request: NextRequest): Role | null {
  const cookie = request.cookies.get(ACTIVE_ROLE_COOKIE)
  if (!cookie?.value) return null

  const role = cookie.value as Role
  if (role === 'admin' || role === 'vendor' || role === 'collector') {
    return role
  }

  return null
}

/**
 * Set user's preferred active role cookie
 * This is a UI preference only - authorization still uses all roles from JWT
 * 
 * @param response - Next.js response object
 * @param role - Role to set as active
 */
export function setActiveRole(response: NextResponse, role: Role): void {
  response.cookies.set(ACTIVE_ROLE_COOKIE, role, ACTIVE_ROLE_COOKIE_OPTIONS)
}

/**
 * Clear user's active role preference
 * 
 * @param response - Next.js response object
 */
export function clearActiveRole(response: NextResponse): void {
  response.cookies.set(ACTIVE_ROLE_COOKIE, "", {
    ...ACTIVE_ROLE_COOKIE_OPTIONS,
    maxAge: 0,
  })
}

// ============================================
// Session Management
// ============================================

/**
 * Get user context from request
 * Extracts JWT from Supabase session and decodes roles/permissions
 * 
 * @param request - Next.js request object
 * @returns UserContext if authenticated, null otherwise
 */
export async function getUserFromRequest(
  request: NextRequest
): Promise<UserContext | null> {
  try {
    // Create Supabase client for request
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set() {},
          remove() {},
        },
      }
    )

    // Get session
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session?.access_token) {
      return null
    }

    // Extract user context from JWT
    return getUserContextFromToken(session.access_token)
  } catch (error) {
    console.error("[rbac-session] Failed to get user from request:", error)
    return null
  }
}

/**
 * Determine the best default role for a user with multiple roles
 * Priority: admin > vendor > collector
 * 
 * @param user - User context
 * @returns Best default role
 */
export function getDefaultRole(user: UserContext): Role {
  if (user.roles.includes('admin')) return 'admin'
  if (user.roles.includes('vendor')) return 'vendor'
  if (user.roles.includes('collector')) return 'collector'
  
  // Fallback (shouldn't happen if user has roles)
  return user.roles[0] || 'collector'
}

/**
 * Get the appropriate dashboard route for a role
 * 
 * @param role - User role
 * @returns Dashboard URL path
 */
export function getDashboardForRole(role: Role): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'vendor':
      return '/vendor/dashboard'
    case 'collector':
      return '/collector/dashboard'
    default:
      return '/dashboard'
  }
}

/**
 * Redirect to appropriate dashboard based on user's roles
 * If user has multiple roles, uses active_role preference or defaults to highest privilege
 * 
 * @param request - Next.js request object
 * @param user - User context
 * @returns NextResponse redirect
 */
export function redirectToDashboard(
  request: NextRequest,
  user: UserContext
): NextResponse {
  // Check if user has a preferred active role
  const activeRole = getActiveRole(request)
  
  // Use active role if valid, otherwise use default
  const targetRole = activeRole && user.roles.includes(activeRole)
    ? activeRole
    : getDefaultRole(user)

  const dashboardUrl = getDashboardForRole(targetRole)
  const response = NextResponse.redirect(new URL(dashboardUrl, request.url))

  // Set active role cookie if it changed
  if (!activeRole || activeRole !== targetRole) {
    setActiveRole(response, targetRole)
  }

  return response
}

/**
 * Check if user needs to select a role (has multiple roles but no preference)
 * 
 * @param request - Next.js request object
 * @param user - User context
 * @returns true if role selection is needed
 */
export function needsRoleSelection(
  request: NextRequest,
  user: UserContext
): boolean {
  // Only need role selection if user has multiple roles
  if (user.roles.length <= 1) return false

  // Check if active role is set and valid
  const activeRole = getActiveRole(request)
  if (activeRole && user.roles.includes(activeRole)) {
    return false
  }

  // User has multiple roles but no valid preference
  return true
}

/**
 * Redirect to role selection page
 * 
 * @param request - Next.js request object
 * @returns NextResponse redirect
 */
export function redirectToRoleSelection(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/auth/select-role', request.url))
}

// ============================================
// Session Validation
// ============================================

/**
 * Validate that session is not expired and refresh if needed
 * 
 * @param request - Next.js request object
 * @returns Validated session or null if invalid
 */
export async function validateSession(
  request: NextRequest
): Promise<UserContext | null> {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) return null

    // Check if session looks valid
    if (!user.userId || !user.email) {
      console.warn("[rbac-session] Invalid session: missing user data")
      return null
    }

    return user
  } catch (error) {
    console.error("[rbac-session] Session validation error:", error)
    return null
  }
}

// ============================================
// Logout Helper
// ============================================

/**
 * Clear all session data and redirect to login
 * 
 * @param request - Next.js request object
 * @param supabase - Supabase client
 * @returns NextResponse redirect to login
 */
export async function logout(
  request: NextRequest,
  supabase: any
): Promise<NextResponse> {
  // Sign out from Supabase
  await supabase.auth.signOut()

  // Create redirect response
  const response = NextResponse.redirect(new URL('/login', request.url))

  // Clear active role cookie
  clearActiveRole(response)

  return response
}

// ============================================
// Exports
// ============================================

export default {
  getActiveRole,
  setActiveRole,
  clearActiveRole,
  getUserFromRequest,
  getDefaultRole,
  getDashboardForRole,
  redirectToDashboard,
  needsRoleSelection,
  redirectToRoleSelection,
  validateSession,
  logout,
}
