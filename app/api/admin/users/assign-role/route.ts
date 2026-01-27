/**
 * API: Assign role to user
 * Admin-only endpoint
 */

import { NextRequest, NextResponse } from "next/server"
import { withAdmin } from "@/lib/rbac/middleware"
import { createClient as createServiceClient } from "@/lib/supabase/server"

export const POST = withAdmin(async (request: NextRequest, { user: adminUser }) => {
  try {
    const body = await request.json()
    const { user_id, role, resource_id } = body

    if (!user_id || !role) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, role" },
        { status: 400 }
      )
    }

    if (!["admin", "vendor", "collector"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Check if role already exists
    const { data: existing, error: checkError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user_id)
      .eq("role", role)
      .maybeSingle()

    if (checkError) {
      console.error("[admin/users/assign-role] Error checking existing role:", checkError)
      return NextResponse.json(
        { error: "Failed to check existing role" },
        { status: 500 }
      )
    }

    if (existing) {
      // Role exists - just make it active if it was inactive
      if (!existing.is_active) {
        const { error: updateError } = await supabase
          .from("user_roles")
          .update({
            is_active: true,
            granted_by: adminUser.userId,
          })
          .eq("id", existing.id)

        if (updateError) {
          console.error("[admin/users/assign-role] Error reactivating role:", updateError)
          return NextResponse.json(
            { error: "Failed to reactivate role" },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: "Role reactivated",
        })
      }

      return NextResponse.json(
        { error: "User already has this role" },
        { status: 400 }
      )
    }

    // Insert new role
    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({
        user_id,
        role,
        resource_id: resource_id || null,
        is_active: true,
        granted_by: adminUser.userId,
        metadata: {
          assigned_by_admin: adminUser.email,
          assigned_at: new Date().toISOString(),
        },
      })

    if (insertError) {
      console.error("[admin/users/assign-role] Error inserting role:", insertError)
      return NextResponse.json(
        { error: "Failed to assign role" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Role assigned successfully",
    })
  } catch (error: any) {
    console.error("[admin/users/assign-role] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
})
