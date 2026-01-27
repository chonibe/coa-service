/**
 * RBAC Middleware for API Route Protection
 * 
 * Provides a unified middleware for protecting API routes with role and permission checks.
 * Replaces the old guardAdminRequest and guardVendorRequest functions.
 * 
 * @module lib/rbac/middleware
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import type { Role, Permission, UserContext } from "./index"
import {
  getUserContext,
  hasRole,
  hasPermission,
  hasAnyRole,
  hasAnyPermission,
  RBACError,
} from "./index"

// ============================================
// Types
// ============================================

export interface AuthOptions {
  /** Required roles (user must have at least one) */
  roles?: Role[]
  
  /** Required permissions (user must have at least one) */
  permissions?: Permission[]
  
  /** Require all roles instead of any */
  requireAllRoles?: boolean
  
  /** Require all permissions instead of any */
  requireAllPermissions?: boolean
  
  /** Custom error messages */
  errorMessages?: {
    unauthorized?: string
    forbidden?: string
  }
}

export type ApiHandler = (
  request: NextRequest,
  context: { params?: any; user: UserContext }
) => Promise<Response> | Response

export interface AuthResult {
  authorized: boolean
  user: UserContext | null
  error?: {
    status: number
    message: string
    code: string
  }
}

// ============================================
// Core Middleware
// ============================================

/**
 * Unified auth middleware for API routes
 * 
 * Usage:
 * ```typescript
 * export const GET = withAuth(
 *   async (request, { user }) => {
 *     // Handler logic with guaranteed user context
 *     return NextResponse.json({ data: 'Protected data' })
 *   },
 *   { roles: ['admin'] }
 * )
 * ```
 */
export function withAuth(
  handler: ApiHandler,
  options: AuthOptions = {}
): (request: NextRequest, context?: any) => Promise<Response> {
  return async (request: NextRequest, context?: any) => {
    try {
      // Get user context from session
      const cookieStore = cookies()
      const supabase = createClient(cookieStore)
      const user = await getUserContext(supabase)

      // Check authentication
      if (!user) {
        return NextResponse.json(
          {
            error: 'Unauthorized',
            message: options.errorMessages?.unauthorized || 'Authentication required',
          },
          { status: 401 }
        )
      }

      // Check roles if specified
      if (options.roles && options.roles.length > 0) {
        const hasRequiredRole = options.requireAllRoles
          ? options.roles.every(role => hasRole(user, role))
          : options.roles.some(role => hasRole(user, role))

        if (!hasRequiredRole) {
          return NextResponse.json(
            {
              error: 'Forbidden',
              message:
                options.errorMessages?.forbidden ||
                `Required role: ${options.roles.join(' or ')}`,
              requiredRoles: options.roles,
            },
            { status: 403 }
          )
        }
      }

      // Check permissions if specified
      if (options.permissions && options.permissions.length > 0) {
        const hasRequiredPermission = options.requireAllPermissions
          ? options.permissions.every(perm => hasPermission(user, perm))
          : options.permissions.some(perm => hasPermission(user, perm))

        if (!hasRequiredPermission) {
          return NextResponse.json(
            {
              error: 'Forbidden',
              message:
                options.errorMessages?.forbidden ||
                `Required permission: ${options.permissions.join(' or ')}`,
              requiredPermissions: options.permissions,
            },
            { status: 403 }
          )
        }
      }

      // Call the handler with user context
      return await handler(request, { ...context, user })
    } catch (error) {
      console.error('[rbac-middleware] Error:', error)

      if (error instanceof RBACError) {
        return NextResponse.json(
          {
            error: error.name,
            message: error.message,
            code: error.code,
          },
          { status: error.code === 'UNAUTHORIZED' ? 401 : 403 }
        )
      }

      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: 'An error occurred processing your request',
        },
        { status: 500 }
      )
    }
  }
}

// ============================================
// Convenience Middleware
// ============================================

/**
 * Middleware that requires admin role
 * 
 * Usage:
 * ```typescript
 * export const GET = withAdmin(async (request, { user }) => {
 *   // Admin-only handler
 * })
 * ```
 */
export function withAdmin(handler: ApiHandler): ReturnType<typeof withAuth> {
  return withAuth(handler, {
    roles: ['admin'],
    errorMessages: {
      forbidden: 'Admin access required',
    },
  })
}

/**
 * Middleware that requires vendor role
 * 
 * Usage:
 * ```typescript
 * export const GET = withVendor(async (request, { user }) => {
 *   // Vendor-only handler
 *   // user.vendorId is available
 * })
 * ```
 */
export function withVendor(handler: ApiHandler): ReturnType<typeof withAuth> {
  return withAuth(handler, {
    roles: ['vendor'],
    errorMessages: {
      forbidden: 'Vendor access required',
    },
  })
}

/**
 * Middleware that requires collector role
 * 
 * Usage:
 * ```typescript
 * export const GET = withCollector(async (request, { user }) => {
 *   // Collector-only handler
 * })
 * ```
 */
export function withCollector(handler: ApiHandler): ReturnType<typeof withAuth> {
  return withAuth(handler, {
    roles: ['collector'],
    errorMessages: {
      forbidden: 'Collector access required',
    },
  })
}

/**
 * Middleware that requires vendor OR admin role
 * Useful for endpoints that vendors can access for their own data, but admins can access for all data
 */
export function withVendorOrAdmin(handler: ApiHandler): ReturnType<typeof withAuth> {
  return withAuth(handler, {
    roles: ['vendor', 'admin'],
    errorMessages: {
      forbidden: 'Vendor or admin access required',
    },
  })
}

// ============================================
// Auth Check Utility (non-middleware)
// ============================================

/**
 * Check authentication without middleware wrapping
 * Useful for Next.js server components and actions
 * 
 * @param request - Optional NextRequest for API routes
 * @returns AuthResult with user context if authorized
 */
export async function checkAuth(request?: NextRequest): Promise<AuthResult> {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const user = await getUserContext(supabase)

    if (!user) {
      return {
        authorized: false,
        user: null,
        error: {
          status: 401,
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
      }
    }

    return {
      authorized: true,
      user,
    }
  } catch (error) {
    console.error('[rbac-middleware] checkAuth error:', error)
    return {
      authorized: false,
      user: null,
      error: {
        status: 500,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    }
  }
}

/**
 * Check if request has required role(s)
 * 
 * @param request - Optional NextRequest for API routes
 * @param roles - Required roles
 * @param requireAll - If true, user must have all roles
 * @returns AuthResult with detailed error if unauthorized
 */
export async function checkRole(
  roles: Role | Role[],
  requireAll: boolean = false,
  request?: NextRequest
): Promise<AuthResult> {
  const authResult = await checkAuth(request)

  if (!authResult.authorized || !authResult.user) {
    return authResult
  }

  const rolesArray = Array.isArray(roles) ? roles : [roles]
  const hasRequiredRole = requireAll
    ? rolesArray.every(role => hasRole(authResult.user, role))
    : rolesArray.some(role => hasRole(authResult.user, role))

  if (!hasRequiredRole) {
    return {
      authorized: false,
      user: authResult.user,
      error: {
        status: 403,
        message: `Required role: ${rolesArray.join(requireAll ? ' and ' : ' or ')}`,
        code: 'FORBIDDEN',
      },
    }
  }

  return authResult
}

/**
 * Check if request has required permission(s)
 * 
 * @param request - Optional NextRequest for API routes
 * @param permissions - Required permissions
 * @param requireAll - If true, user must have all permissions
 * @returns AuthResult with detailed error if unauthorized
 */
export async function checkPermission(
  permissions: Permission | Permission[],
  requireAll: boolean = false,
  request?: NextRequest
): Promise<AuthResult> {
  const authResult = await checkAuth(request)

  if (!authResult.authorized || !authResult.user) {
    return authResult
  }

  const permsArray = Array.isArray(permissions) ? permissions : [permissions]
  const hasRequiredPerm = requireAll
    ? permsArray.every(perm => hasPermission(authResult.user, perm))
    : permsArray.some(perm => hasPermission(authResult.user, perm))

  if (!hasRequiredPerm) {
    return {
      authorized: false,
      user: authResult.user,
      error: {
        status: 403,
        message: `Required permission: ${permsArray.join(requireAll ? ' and ' : ' or ')}`,
        code: 'FORBIDDEN',
      },
    }
  }

  return authResult
}

// ============================================
// Exports
// ============================================

export default {
  withAuth,
  withAdmin,
  withVendor,
  withCollector,
  withVendorOrAdmin,
  checkAuth,
  checkRole,
  checkPermission,
}
