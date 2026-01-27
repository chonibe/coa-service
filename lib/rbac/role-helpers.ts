/**
 * RBAC Role Helper Functions
 * 
 * Database query helpers for working with user_roles table
 * and determining user roles from the RBAC system
 */

import { createClient as createServiceClient } from "@/lib/supabase/server"
import type { Role } from "./index"

/**
 * Get all active roles for a user from the user_roles table
 * 
 * @param userId - User's auth ID
 * @returns Array of active role names
 */
export async function getUserActiveRoles(userId: string): Promise<Role[]> {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("is_active", true)
      .or("expires_at.is.null,expires_at.gt.now()")
    
    if (error) {
      console.error("[rbac-helpers] Error fetching user roles:", error)
      return []
    }
    
    return (data || []).map(r => r.role as Role)
  } catch (error) {
    console.error("[rbac-helpers] Exception fetching user roles:", error)
    return []
  }
}

/**
 * Check if user has a specific role in the database
 * 
 * @param userId - User's auth ID
 * @param role - Role to check for
 * @returns true if user has the active role
 */
export async function userHasRole(userId: string, role: Role): boolean {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", role)
      .eq("is_active", true)
      .or("expires_at.is.null,expires_at.gt.now()")
      .maybeSingle()
    
    if (error) {
      console.error("[rbac-helpers] Error checking user role:", error)
      return false
    }
    
    return !!data
  } catch (error) {
    console.error("[rbac-helpers] Exception checking user role:", error)
    return false
  }
}

/**
 * Get vendor ID for a user from user_roles table
 * 
 * @param userId - User's auth ID
 * @returns Vendor ID if user has vendor role, null otherwise
 */
export async function getUserVendorId(userId: string): Promise<number | null> {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from("user_roles")
      .select("resource_id")
      .eq("user_id", userId)
      .eq("role", "vendor")
      .eq("is_active", true)
      .or("expires_at.is.null,expires_at.gt.now()")
      .maybeSingle()
    
    if (error) {
      console.error("[rbac-helpers] Error fetching vendor ID:", error)
      return null
    }
    
    return data?.resource_id || null
  } catch (error) {
    console.error("[rbac-helpers] Exception fetching vendor ID:", error)
    return null
  }
}

/**
 * Determine the preferred dashboard based on roles and login intent
 * 
 * Priority:
 * 1. If loginIntent is specified, use that (if user has that role)
 * 2. Otherwise: admin > vendor > collector
 * 
 * @param roles - Array of user's active roles
 * @param loginIntent - Intended role from login flow (optional)
 * @returns Dashboard path to redirect to
 */
export function getPreferredDashboard(
  roles: Role[],
  loginIntent?: 'admin' | 'vendor' | 'collector'
): string {
  // If login intent is specified, ALWAYS honor it (users can choose which dashboard to go to)
  if (loginIntent) {
    console.log(`[rbac] Login intent specified: ${loginIntent}, honoring user choice`)
    switch (loginIntent) {
      case 'admin':
        // Only allow admin if user has admin role
        if (roles.includes('admin')) {
          return '/admin/dashboard'
        }
        break
      case 'vendor':
        // Only allow vendor if user has vendor role
        if (roles.includes('vendor')) {
          return '/vendor/dashboard'
        }
        break
      case 'collector':
        // Always allow collector dashboard (creates role if needed)
        return '/collector/dashboard'
    }
  }
  
  // Default priority when no intent specified: admin > vendor > collector
  if (roles.includes('admin')) {
    return '/admin/dashboard'
  }
  
  if (roles.includes('vendor')) {
    return '/vendor/dashboard'
  }
  
  if (roles.includes('collector')) {
    return '/collector/dashboard'
  }
  
  // Fallback (shouldn't happen if user has roles)
  return '/login?error=no_role'
}

/**
 * Check if user has multiple roles (multi-role user)
 * 
 * @param roles - Array of user's active roles
 * @returns true if user has more than one role
 */
export function isMultiRoleUser(roles: Role[]): boolean {
  return roles.length > 1
}

/**
 * Get role label for display
 * 
 * @param role - Role to get label for
 * @returns Human-readable role label
 */
export function getRoleLabel(role: Role): string {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'vendor':
      return 'Vendor'
    case 'collector':
      return 'Collector'
    default:
      return role
  }
}
