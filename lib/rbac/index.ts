/**
 * RBAC (Role-Based Access Control) System
 * 
 * Unified role and permission management system that replaces the fragmented
 * admin/vendor/collector session cookies with a single Supabase JWT-based approach.
 * 
 * @module lib/rbac
 */

import { SupabaseClient, User } from "@supabase/supabase-js"

// ============================================
// Types
// ============================================

/**
 * Available roles in the system
 */
export type Role = 'admin' | 'vendor' | 'collector'

/**
 * Granular permissions for fine-grained access control
 */
export type Permission =
  // Admin permissions
  | 'admin:all'
  | 'vendors:manage'
  | 'collectors:manage'
  | 'orders:manage'
  | 'products:manage'
  | 'payouts:manage'
  | 'users:manage'
  | 'reports:view'
  | 'security:audit'
  | 'impersonate:vendor'
  
  // Vendor permissions
  | 'vendor:dashboard'
  | 'products:create'
  | 'products:edit'
  | 'products:delete'
  | 'series:manage'
  | 'media:manage'
  | 'orders:view'
  | 'payouts:view'
  | 'payouts:request'
  | 'analytics:view'
  | 'store:access'
  
  // Collector permissions
  | 'collector:dashboard'
  | 'artwork:view'
  | 'artwork:authenticate'
  | 'series:view'
  | 'profile:manage'
  | 'benefits:access'
  | 'avatar:manage'
  
  // Membership permissions (Collector)
  | 'membership:view'
  | 'membership:subscribe'
  | 'membership:manage'
  | 'credits:view'
  | 'credits:redeem'
  | 'checkout:member'
  
  // Membership permissions (Admin)
  | 'membership:admin'
  | 'credits:admin'

/**
 * User context with roles and permissions
 */
export interface UserContext {
  userId: string
  email: string
  roles: Role[]
  vendorId?: number
  permissions: Permission[]
  metadata?: Record<string, any>
}

/**
 * JWT claims structure from Supabase
 */
export interface JWTClaims {
  sub: string
  email?: string
  user_roles?: Role[]
  vendor_id?: number
  user_permissions?: Permission[]
  rbac_version?: string
  [key: string]: any
}

// ============================================
// Context Retrieval
// ============================================

/**
 * Get user context from Supabase session
 * Extracts roles and permissions from JWT claims
 * 
 * @param supabase - Supabase client instance
 * @returns UserContext if authenticated, null otherwise
 */
export async function getUserContext(
  supabase: SupabaseClient
): Promise<UserContext | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session?.user) {
      return null
    }

    const user = session.user
    const claims = user.app_metadata as JWTClaims

    // Extract roles from JWT claims (injected by custom_access_token hook)
    const roles = claims.user_roles || []
    const vendorId = claims.vendor_id
    const permissions = claims.user_permissions || []

    return {
      userId: user.id,
      email: user.email || '',
      roles,
      vendorId,
      permissions,
      metadata: user.user_metadata,
    }
  } catch (error) {
    console.error('[rbac] Failed to get user context:', error)
    return null
  }
}

/**
 * Get user context from JWT access token directly
 * Useful when you have the token but not the full session
 * 
 * @param accessToken - JWT access token
 * @returns UserContext if valid, null otherwise
 */
export function getUserContextFromToken(accessToken: string): UserContext | null {
  try {
    // Decode JWT (without verification - Supabase handles that)
    const parts = accessToken.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    const claims = payload as JWTClaims

    return {
      userId: claims.sub,
      email: claims.email || '',
      roles: claims.user_roles || [],
      vendorId: claims.vendor_id,
      permissions: claims.user_permissions || [],
      metadata: {},
    }
  } catch (error) {
    console.error('[rbac] Failed to decode JWT token:', error)
    return null
  }
}

// ============================================
// Role Checks
// ============================================

/**
 * Check if user has a specific role
 * 
 * @param ctx - User context
 * @param role - Role to check
 * @returns true if user has the role
 */
export function hasRole(ctx: UserContext | null, role: Role): boolean {
  if (!ctx) return false
  return ctx.roles.includes(role)
}

/**
 * Check if user has any of the specified roles
 * 
 * @param ctx - User context
 * @param roles - Array of roles to check
 * @returns true if user has at least one of the roles
 */
export function hasAnyRole(ctx: UserContext | null, roles: Role[]): boolean {
  if (!ctx) return false
  return roles.some(role => ctx.roles.includes(role))
}

/**
 * Check if user has all of the specified roles
 * 
 * @param ctx - User context
 * @param roles - Array of roles to check
 * @returns true if user has all roles
 */
export function hasAllRoles(ctx: UserContext | null, roles: Role[]): boolean {
  if (!ctx) return false
  return roles.every(role => ctx.roles.includes(role))
}

/**
 * Require a specific role, throw error if missing
 * 
 * @param ctx - User context
 * @param role - Required role
 * @throws Error if user doesn't have the role
 */
export function requireRole(ctx: UserContext | null, role: Role): void {
  if (!hasRole(ctx, role)) {
    throw new RBACError(`Required role: ${role}`, 'FORBIDDEN', role)
  }
}

/**
 * Require any of the specified roles, throw error if none match
 * 
 * @param ctx - User context
 * @param roles - Required roles (any one)
 * @throws Error if user doesn't have any of the roles
 */
export function requireAnyRole(ctx: UserContext | null, roles: Role[]): void {
  if (!hasAnyRole(ctx, roles)) {
    throw new RBACError(
      `Required one of roles: ${roles.join(', ')}`,
      'FORBIDDEN',
      roles.join(',')
    )
  }
}

// ============================================
// Permission Checks
// ============================================

/**
 * Check if user has a specific permission
 * 
 * @param ctx - User context
 * @param permission - Permission to check
 * @returns true if user has the permission
 */
export function hasPermission(
  ctx: UserContext | null,
  permission: Permission
): boolean {
  if (!ctx) return false
  
  // Admins with admin:all permission have access to everything
  if (ctx.permissions.includes('admin:all')) {
    return true
  }
  
  return ctx.permissions.includes(permission)
}

/**
 * Check if user has any of the specified permissions
 * 
 * @param ctx - User context
 * @param permissions - Array of permissions to check
 * @returns true if user has at least one permission
 */
export function hasAnyPermission(
  ctx: UserContext | null,
  permissions: Permission[]
): boolean {
  if (!ctx) return false
  
  // Admins with admin:all have access to everything
  if (ctx.permissions.includes('admin:all')) {
    return true
  }
  
  return permissions.some(perm => ctx.permissions.includes(perm))
}

/**
 * Check if user has all of the specified permissions
 * 
 * @param ctx - User context
 * @param permissions - Array of permissions to check
 * @returns true if user has all permissions
 */
export function hasAllPermissions(
  ctx: UserContext | null,
  permissions: Permission[]
): boolean {
  if (!ctx) return false
  
  // Admins with admin:all have access to everything
  if (ctx.permissions.includes('admin:all')) {
    return true
  }
  
  return permissions.every(perm => ctx.permissions.includes(perm))
}

/**
 * Require a specific permission, throw error if missing
 * 
 * @param ctx - User context
 * @param permission - Required permission
 * @throws Error if user doesn't have the permission
 */
export function requirePermission(
  ctx: UserContext | null,
  permission: Permission
): void {
  if (!hasPermission(ctx, permission)) {
    throw new RBACError(
      `Required permission: ${permission}`,
      'FORBIDDEN',
      permission
    )
  }
}

/**
 * Require any of the specified permissions, throw error if none match
 * 
 * @param ctx - User context
 * @param permissions - Required permissions (any one)
 * @throws Error if user doesn't have any of the permissions
 */
export function requireAnyPermission(
  ctx: UserContext | null,
  permissions: Permission[]
): void {
  if (!hasAnyPermission(ctx, permissions)) {
    throw new RBACError(
      `Required one of permissions: ${permissions.join(', ')}`,
      'FORBIDDEN',
      permissions.join(',')
    )
  }
}

// ============================================
// Convenience Checks
// ============================================

/**
 * Check if user is an admin
 */
export function isAdmin(ctx: UserContext | null): boolean {
  return hasRole(ctx, 'admin')
}

/**
 * Check if user is a vendor
 */
export function isVendor(ctx: UserContext | null): boolean {
  return hasRole(ctx, 'vendor')
}

/**
 * Check if user is a collector
 */
export function isCollector(ctx: UserContext | null): boolean {
  return hasRole(ctx, 'collector')
}

/**
 * Check if user is authenticated (has any role)
 */
export function isAuthenticated(ctx: UserContext | null): boolean {
  return ctx !== null && ctx.roles.length > 0
}

/**
 * Require authentication, throw error if not authenticated
 */
export function requireAuthentication(ctx: UserContext | null): void {
  if (!isAuthenticated(ctx)) {
    throw new RBACError('Authentication required', 'UNAUTHORIZED')
  }
}

// ============================================
// Error Handling
// ============================================

/**
 * RBAC-specific error class
 */
export class RBACError extends Error {
  constructor(
    message: string,
    public code: 'UNAUTHORIZED' | 'FORBIDDEN' = 'FORBIDDEN',
    public requiredAccess?: string
  ) {
    super(message)
    this.name = 'RBACError'
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      code: this.code,
      requiredAccess: this.requiredAccess,
    }
  }
}

// ============================================
// Exports
// ============================================

export default {
  getUserContext,
  getUserContextFromToken,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  requireRole,
  requireAnyRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  requirePermission,
  requireAnyPermission,
  isAdmin,
  isVendor,
  isCollector,
  isAuthenticated,
  requireAuthentication,
  RBACError,
}
