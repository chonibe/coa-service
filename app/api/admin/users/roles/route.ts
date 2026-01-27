/**
 * API: Get all users with their roles
 * Admin-only endpoint
 */

import { NextRequest, NextResponse } from "next/server"
import { withAdmin } from "@/lib/rbac/middleware"
import { createClient as createServiceClient } from "@/lib/supabase/server"

export const GET = withAdmin(async (request: NextRequest) => {
  try {
    const supabase = createServiceClient()

    // Get all users with their roles
    const { data: usersData, error: usersError } = await supabase
      .from("user_roles")
      .select(`
        user_id,
        role,
        resource_id,
        is_active,
        granted_at,
        metadata
      `)
      .order("granted_at", { ascending: false })

    if (usersError) {
      console.error("[admin/users/roles] Error fetching roles:", usersError)
      return NextResponse.json(
        { error: "Failed to fetch user roles" },
        { status: 500 }
      )
    }

    // Get auth.users data for emails
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error("[admin/users/roles] Error fetching auth users:", authError)
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      )
    }

    // Get vendor names for vendor roles
    const vendorIds = usersData
      ?.filter(r => r.role === "vendor" && r.resource_id)
      .map(r => r.resource_id!) || []

    const { data: vendors } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .in("id", vendorIds)

    const vendorMap = new Map(vendors?.map(v => [v.id, v.vendor_name]) || [])

    // Build user map
    const userMap = new Map<string, any>()

    authUsers.users.forEach(authUser => {
      userMap.set(authUser.id, {
        id: authUser.id,
        email: authUser.email,
        roles: [],
        created_at: authUser.created_at,
      })
    })

    // Add roles to users
    usersData?.forEach(roleData => {
      const user = userMap.get(roleData.user_id)
      if (user) {
        user.roles.push({
          role: roleData.role,
          resource_id: roleData.resource_id,
          is_active: roleData.is_active,
          granted_at: roleData.granted_at,
          vendor_name: roleData.resource_id ? vendorMap.get(roleData.resource_id) : null,
        })
      }
    })

    const users = Array.from(userMap.values())

    return NextResponse.json({
      users,
      total: users.length,
    })
  } catch (error: any) {
    console.error("[admin/users/roles] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
})
