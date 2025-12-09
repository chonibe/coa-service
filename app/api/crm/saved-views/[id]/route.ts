import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { Errors } from "@/lib/crm/errors"

/**
 * Saved View Detail API - Get, update, delete specific saved view
 */

async function getUserWorkspaceId(supabase: any, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("crm_workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return data.workspace_id
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)
  
  try {
    if (!supabase) {
      return NextResponse.json(Errors.internal("Database client not initialized"), { status: 500 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(Errors.unauthorized("Authentication required"), { status: 401 })
    }

    const { data, error } = await supabase
      .from("crm_saved_views")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(Errors.notFound("Saved view"), { status: 404 })
      }
      return NextResponse.json(Errors.internal(error.message || "Failed to fetch saved view"), { status: 500 })
    }

    // Check access: user must own it or it must be shared in their workspace
    const workspaceId = await getUserWorkspaceId(supabase, user.id)
    if (data.created_by !== user.id && (!data.is_shared || data.workspace_id !== workspaceId)) {
      return NextResponse.json(Errors.forbidden("You don't have access to this saved view"), { status: 403 })
    }

    return NextResponse.json({
      view: data,
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching saved view:", error)
    return NextResponse.json(Errors.internal(error.message || "Failed to fetch saved view"), { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)
  
  try {
    if (!supabase) {
      return NextResponse.json(Errors.internal("Database client not initialized"), { status: 500 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(Errors.unauthorized("Authentication required"), { status: 401 })
    }

    // Check if view exists and user has access
    const { data: currentView, error: fetchError } = await supabase
      .from("crm_saved_views")
      .select("*")
      .eq("id", params.id)
      .single()

    if (fetchError || !currentView) {
      return NextResponse.json(Errors.notFound("Saved view"), { status: 404 })
    }

    // Check access: user must own it
    if (currentView.created_by !== user.id) {
      return NextResponse.json(Errors.forbidden("You can only update your own saved views"), { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      filter_config,
      sort_config,
      column_config,
      is_shared,
      is_default,
    } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (filter_config !== undefined) updateData.filter_config = filter_config
    if (sort_config !== undefined) updateData.sort_config = sort_config
    if (column_config !== undefined) updateData.column_config = column_config
    if (is_shared !== undefined) updateData.is_shared = is_shared
    if (is_default !== undefined) updateData.is_default = is_default

    // If setting as default, unset other defaults for this entity type and workspace
    if (is_default) {
      await supabase
        .from("crm_saved_views")
        .update({ is_default: false })
        .eq("workspace_id", currentView.workspace_id)
        .eq("entity_type", currentView.entity_type)
        .eq("is_default", true)
        .neq("id", params.id)
    }

    const { data, error } = await supabase
      .from("crm_saved_views")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          Errors.conflict("A saved view with this name already exists", { field: "name" }),
          { status: 409 }
        )
      }
      return NextResponse.json(Errors.internal(error.message || "Failed to update saved view"), { status: 500 })
    }

    return NextResponse.json({
      view: data,
    })
  } catch (error: any) {
    console.error("[CRM] Error updating saved view:", error)
    return NextResponse.json(Errors.internal(error.message || "Failed to update saved view"), { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)
  
  try {
    if (!supabase) {
      return NextResponse.json(Errors.internal("Database client not initialized"), { status: 500 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(Errors.unauthorized("Authentication required"), { status: 401 })
    }

    // Check if view exists and user has access
    const { data: currentView, error: fetchError } = await supabase
      .from("crm_saved_views")
      .select("created_by")
      .eq("id", params.id)
      .single()

    if (fetchError || !currentView) {
      return NextResponse.json(Errors.notFound("Saved view"), { status: 404 })
    }

    // Check access: user must own it
    if (currentView.created_by !== user.id) {
      return NextResponse.json(Errors.forbidden("You can only delete your own saved views"), { status: 403 })
    }

    const { error } = await supabase
      .from("crm_saved_views")
      .delete()
      .eq("id", params.id)

    if (error) {
      return NextResponse.json(Errors.internal(error.message || "Failed to delete saved view"), { status: 500 })
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("[CRM] Error deleting saved view:", error)
    return NextResponse.json(Errors.internal(error.message || "Failed to delete saved view"), { status: 500 })
  }
}

