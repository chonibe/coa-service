import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requirePermission, getWorkspaceMember } from "@/lib/crm/permissions"

/**
 * Workspace Members API
 * Manage workspace members and their permissions
 */

export async function GET(request: NextRequest) {
  const supabase = createClient()

  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to view members
    await requirePermission(supabase, user.id, 'members.manage')

    const { data: members, error } = await supabase
      .from("crm_workspace_members")
      .select(`
        *,
        user:auth.users!user_id (
          id,
          email
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      members: members || [],
    })
  } catch (error: any) {
    console.error("[CRM Members] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message?.includes("Permission denied") ? 403 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to manage members
    await requirePermission(supabase, user.id, 'members.manage')

    const body = await request.json()
    const { user_id, role, permissions, workspace_id } = body

    if (!user_id || !role) {
      return NextResponse.json(
        { error: "user_id and role are required" },
        { status: 400 }
      )
    }

    // Validate role
    if (!['owner', 'admin', 'member', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be one of: owner, admin, member, viewer" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("crm_workspace_members")
      .insert({
        workspace_id: workspace_id || null, // Single workspace for now
        user_id,
        role,
        permissions: permissions || {},
        invited_by_user_id: user.id,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      member: data,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CRM Members] Error creating member:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message?.includes("Permission denied") ? 403 : 500 }
    )
  }
}


