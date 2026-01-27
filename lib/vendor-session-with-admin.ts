/**
 * Vendor Session Helper with Admin Support
 * 
 * Extends vendor session checks to allow admin users to access vendor routes
 */

import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"
import { getVendorFromCookieStore } from "./vendor-session"
import { createClient } from "./supabase-server"
import { getUserContext, hasRole } from "./rbac"

export interface VendorAccessResult {
  vendorName: string | null
  isAdmin: boolean
  hasAccess: boolean
}

/**
 * Check for vendor session OR admin role
 * Returns vendor name if found, or "admin-access" if user is admin
 * 
 * @param cookieStore - Cookie store from Next.js
 * @returns VendorAccessResult with access information
 */
export async function getVendorOrAdminAccess(
  cookieStore: ReadonlyRequestCookies
): Promise<VendorAccessResult> {
  // First check for vendor session cookie (existing behavior)
  const vendorName = getVendorFromCookieStore(cookieStore)
  
  if (vendorName) {
    return {
      vendorName,
      isAdmin: false,
      hasAccess: true,
    }
  }
  
  // If no vendor session, check if user is an admin
  try {
    const supabase = createClient(cookieStore)
    const userContext = await getUserContext(supabase)
    
    if (userContext && hasRole(userContext, 'admin')) {
      return {
        vendorName: "admin-access",
        isAdmin: true,
        hasAccess: true,
      }
    }
  } catch (error) {
    console.error("[vendor-session-with-admin] Error checking admin role:", error)
  }
  
  // No access
  return {
    vendorName: null,
    isAdmin: false,
    hasAccess: false,
  }
}

/**
 * Get vendor name for database queries
 * For admin users, returns null (indicating they should query all vendors)
 * 
 * @param cookieStore - Cookie store from Next.js
 * @returns Vendor name for filtering, or null for admin (all vendors)
 */
export async function getVendorNameForQuery(
  cookieStore: ReadonlyRequestCookies
): Promise<string | null> {
  const access = await getVendorOrAdminAccess(cookieStore)
  
  if (!access.hasAccess) {
    return null
  }
  
  // If admin, return null to indicate they should see all vendors
  if (access.isAdmin) {
    return null
  }
  
  return access.vendorName
}
