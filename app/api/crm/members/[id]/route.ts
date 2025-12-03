import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/crm/permissions"

/**
 * Workspace Member API
 * Update or delete a workspace member
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const { id } = params
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to manage members
    await requirePermission(supabase, user.id, 'members.manage')

    const body = await request.json()
    const { role, permissions, is_active } = body

    const updateData: any = {}
    if (role !== undefined) {
      if (!['owner', 'admin', 'member', 'viewer'].includes(role)) {
        return NextResponse.json(
          { error: "Invalid role" },
          { status: 400 }
        )
      }
      updateData.role = role
    }
    if (permissions !== undefined) {
      updateData.permissions = permissions
    }
    if (is_active !== undefined) {
      updateData.is_active = is_active
    }

    const { data, error } = await supabase
      .from("crm_workspace_members")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      member: data,
    })
  } catch (error: any) {
    console.error("[CRM Members] Error updating member:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message?.includes("Permission denied") ? 403 : 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const { id } = params
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to manage members
    await requirePermission(supabase, user.id, 'members.manage')

    // Soft delete by setting is_active = false
    const { data, error } = await supabase
      .from("crm_workspace_members")
      .update({ is_active: false })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      member: data,
    })
  } catch (error: any) {
    console.error("[CRM Members] Error deleting member:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message?.includes("Permission denied") ? 403 : 500 }
    )
  }
}

