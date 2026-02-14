/**
 * API: GET /api/auth/roles
 * 
 * Returns the current authenticated user's available roles from the RBAC system.
 * Used by the RoleSwitcher component to display available dashboards.
 * 
 * @returns { roles: Role[], activeRole: Role | null, email: string }
 */

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { getUserActiveRoles, getRoleLabel } from "@/lib/rbac/role-helpers"
import { getDashboardForRole } from "@/lib/rbac/session"
import type { Role } from "@/lib/rbac/index"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteClient(cookieStore as any)

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Get roles from RBAC database
    const roles = await getUserActiveRoles(user.id)

    // Get active role from cookie
    const activeRoleCookie = (cookieStore as any).get('active_role')?.value as Role | undefined
    const activeRole = activeRoleCookie && roles.includes(activeRoleCookie)
      ? activeRoleCookie
      : roles[0] || null

    // Build role details for the UI
    const roleDetails = roles.map(role => ({
      role,
      label: getRoleLabel(role),
      dashboard: getDashboardForRole(role),
      isActive: role === activeRole,
    }))

    return NextResponse.json({
      roles,
      activeRole,
      email: user.email,
      roleDetails,
    })
  } catch (error) {
    console.error('[api/auth/roles] Error:', error)
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    )
  }
}
