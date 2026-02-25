/**
 * Unified Session Utility
 * 
 * Single function to resolve user identity from Supabase session (RBAC)
 * OR legacy cookies (vendor_session, collector_session, admin_session).
 * 
 * This is the bridge between the old cookie-based auth system and the new
 * RBAC/JWT-based system. It allows layouts and API routes to use a single
 * call instead of importing multiple session modules.
 * 
 * Feature-flagged via UNIFIED_AUTH_ENABLED env var.
 * 
 * @module lib/auth/unified-session
 * @see lib/rbac/index.ts - Primary RBAC system
 * @see lib/vendor-session.ts - Legacy vendor cookies
 * @see lib/collector-session.ts - Legacy collector cookies
 * @see lib/admin-session.ts - Legacy admin cookies
 */

import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { getUserContext, hasRole, type Role, type Permission, type UserContext } from "@/lib/rbac/index"
import { getUserActiveRoles } from "@/lib/rbac/role-helpers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { getCollectorSession } from "@/lib/collector-session"
import { getAdminEmailFromCookieStore, ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-session"

// ============================================
// Types
// ============================================

/**
 * Normalized session shape returned by getUnifiedSession.
 * Extends UserContext with legacy-specific fields.
 */
export interface UnifiedSession {
  /** Supabase user ID (null for legacy-only sessions without a Supabase account) */
  userId: string | null
  /** User's email address */
  email: string
  /** All active roles from RBAC or inferred from legacy cookies */
  roles: Role[]
  /** Currently active role (from active_role cookie or inferred) */
  activeRole: Role | null
  /** Vendor name from legacy cookie or DB lookup */
  vendorName?: string
  /** Vendor ID from RBAC claims or DB lookup */
  vendorId?: number
  /** Collector identifier (email or shopify customer ID) */
  collectorId?: string
  /** Granular permissions from JWT claims */
  permissions: Permission[]
  /** How the session was resolved */
  source: 'rbac' | 'legacy'
}

// ============================================
// Feature Flag
// ============================================

/**
 * Check if the unified auth system is enabled.
 * When disabled, getUnifiedSession still works but layouts should use legacy path.
 */
export function isUnifiedAuthEnabled(): boolean {
  return process.env.UNIFIED_AUTH_ENABLED === 'true' || process.env.UNIFIED_AUTH_ENABLED === '1'
}

// ============================================
// Main Function
// ============================================

/**
 * Get a unified session by trying RBAC first, then falling back to legacy cookies.
 * 
 * Resolution order:
 * 1. Try Supabase JWT session via getUserContext() (RBAC path)
 * 2. If no Supabase session, fall back to legacy HMAC cookies
 * 3. For legacy sessions, attempt DB role lookup if we can identify the user
 * 
 * @returns UnifiedSession if any session found, null if completely unauthenticated
 */
export async function getUnifiedSession(): Promise<UnifiedSession | null> {
  const cookieStore = cookies()

  // ── Primary path: Supabase JWT / RBAC ──
  try {
    const supabase = createRouteClient(cookieStore)
    const ctx = await getUserContext(supabase)

    if (ctx && ctx.email) {
      // Read active_role preference cookie
      const activeRoleCookie = cookieStore.get('active_role')?.value as Role | undefined
      const activeRole = activeRoleCookie && ctx.roles.includes(activeRoleCookie)
        ? activeRoleCookie
        : ctx.roles[0] || null

      // If roles are empty in JWT but user is authenticated, try DB lookup
      let roles = ctx.roles
      if (roles.length === 0 && ctx.userId) {
        roles = await getUserActiveRoles(ctx.userId)
      }

      // Extract vendor name from legacy cookie if user has vendor role
      // (needed for vendor layout DB lookups that use vendor name)
      let vendorName: string | undefined
      if (roles.includes('vendor')) {
        vendorName = getVendorFromCookieStore(cookieStore) || undefined
      }

      // Extract collector ID if user has collector role
      let collectorId: string | undefined
      if (roles.includes('collector')) {
        const collectorSession = getCollectorSession(cookieStore)
        collectorId = collectorSession?.email || collectorSession?.shopifyCustomerId || undefined
      }

      return {
        userId: ctx.userId,
        email: ctx.email,
        roles,
        activeRole,
        vendorName,
        vendorId: ctx.vendorId,
        collectorId,
        permissions: ctx.permissions,
        source: 'rbac',
      }
    }
  } catch (error) {
    // Supabase client creation can fail if env vars are missing in edge cases.
    // Fall through to legacy path.
    console.warn('[unified-session] RBAC path failed, trying legacy:', error)
  }

  // ── Fallback path: Legacy cookies ──
  return getSessionFromLegacyCookies(cookieStore)
}

// ============================================
// Legacy Cookie Fallback
// ============================================

/**
 * Build a UnifiedSession from legacy HMAC-signed cookies.
 * This is the fallback when no Supabase JWT session exists.
 */
async function getSessionFromLegacyCookies(
  cookieStore: ReturnType<typeof cookies>
): Promise<UnifiedSession | null> {
  const roles: Role[] = []
  let email: string | null = null
  let vendorName: string | undefined
  let collectorId: string | undefined
  let userId: string | null = null

  // Check admin cookie
  const adminEmail = getAdminEmailFromCookieStore(cookieStore)
  if (adminEmail) {
    roles.push('admin')
    email = adminEmail
  }

  // Check vendor cookie
  const vendorFromCookie = getVendorFromCookieStore(cookieStore)
  if (vendorFromCookie) {
    roles.push('vendor')
    vendorName = vendorFromCookie
    // Vendor cookie doesn't carry email, so we can't set it here
    // unless admin session already provided one
  }

  // Check collector cookie
  const collectorSession = getCollectorSession(cookieStore)
  if (collectorSession?.email) {
    roles.push('collector')
    collectorId = collectorSession.email || collectorSession.shopifyCustomerId || undefined
    if (!email) {
      email = collectorSession.email
    }
  }

  // No session at all
  if (roles.length === 0 || !email) {
    // Special case: vendor-only session may not have email
    if (vendorName && roles.includes('vendor')) {
      return {
        userId: null,
        email: '', // vendor cookie doesn't carry email
        roles,
        activeRole: 'vendor',
        vendorName,
        permissions: [],
        source: 'legacy',
      }
    }
    return null
  }

  // Determine active role from cookie or infer from available roles
  const activeRoleCookie = cookieStore.get('active_role')?.value as Role | undefined
  const activeRole = activeRoleCookie && roles.includes(activeRoleCookie)
    ? activeRoleCookie
    : roles[0]

  return {
    userId,
    email,
    roles,
    activeRole,
    vendorName,
    collectorId,
    permissions: [], // Legacy cookies don't carry permissions
    source: 'legacy',
  }
}

// ============================================
// Convenience Helpers
// ============================================

/**
 * Check if a unified session has a specific role.
 * Works with both RBAC and legacy sessions.
 */
export function sessionHasRole(session: UnifiedSession | null, role: Role): boolean {
  if (!session) return false
  return session.roles.includes(role)
}

/**
 * Check if a unified session has any of the specified roles.
 */
export function sessionHasAnyRole(session: UnifiedSession | null, roles: Role[]): boolean {
  if (!session) return false
  return roles.some(role => session.roles.includes(role))
}

/**
 * Require a specific role from a unified session.
 * @throws Error if role is missing
 */
export function requireSessionRole(session: UnifiedSession | null, role: Role): void {
  if (!sessionHasRole(session, role)) {
    throw new Error(`[unified-session] Required role: ${role}`)
  }
}
