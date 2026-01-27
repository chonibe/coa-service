/**
 * API: Revoke role from user
 * Admin-only endpoint
 */

import { NextRequest, NextResponse } from "next/server"
import { withAdmin } from "@/lib/rbac/middleware"
import { createClient as createServiceClient } from "@/lib/supabase/server"

export const POST = withAdmin(async (request: NextRequest, { user: adminUser }) => {
  try {
    const body = await request.json()
    const { user_id, role } = body

    if (!user_id || !role) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, role" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from("user_roles")
      .update({
        is_active: false,
        granted_by: adminUser.userId, // Track who revoked it
      })
      .eq("user_id", user_id)
      .eq("role", role)

    if (error) {
      console.error("[admin/users/revoke-role] Error revoking role:", error)
      return NextResponse.json(
        { error: "Failed to revoke role" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Role revoked successfully",
    })
  } catch (error: any) {
    console.error("[admin/users/revoke-role] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
})
