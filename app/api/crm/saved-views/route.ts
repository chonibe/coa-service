import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { Errors } from "@/lib/crm/errors"

/**
 * Saved Views API - Manage saved filter combinations
 * Allows users to save and share filter/sort configurations
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

export async function GET(request: NextRequest) {
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

    // Get user's workspace
    const workspaceId = await getUserWorkspaceId(supabase, user.id)
    if (!workspaceId) {
      return NextResponse.json(Errors.forbidden("User is not a member of any workspace"), { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get("entity_type")
    const isShared = searchParams.get("is_shared") === "true"

    let query = supabase
      .from("crm_saved_views")
      .select("*", { count: "exact" })
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })

    if (entityType) {
      query = query.eq("entity_type", entityType)
    }

    // Filter: user's own views OR shared views
    if (isShared) {
      query = query.eq("is_shared", true)
    } else {
      query = query.or(`created_by.eq.${user.id},is_shared.eq.true`)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(Errors.internal(error.message || "Failed to fetch saved views"), { status: 500 })
    }

    return NextResponse.json({
      views: data || [],
      total: count || 0,
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching saved views:", error)
    return NextResponse.json(Errors.internal(error.message || "Failed to fetch saved views"), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    // Get user's workspace
    const workspaceId = await getUserWorkspaceId(supabase, user.id)
    if (!workspaceId) {
      return NextResponse.json(Errors.forbidden("User is not a member of any workspace"), { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      entity_type,
      filter_config,
      sort_config,
      column_config,
      is_shared,
      is_default,
    } = body

    if (!name || !entity_type) {
      return NextResponse.json(
        Errors.validation("name and entity_type are required", { 
          field: !name ? "name" : "entity_type" 
        }),
        { status: 400 }
      )
    }

    // Validate entity_type
    const validEntityTypes = ['person', 'company', 'conversation', 'activity']
    if (!validEntityTypes.includes(entity_type)) {
      return NextResponse.json(
        Errors.validation(`entity_type must be one of: ${validEntityTypes.join(', ')}`, { 
          field: "entity_type" 
        }),
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults for this entity type and workspace
    if (is_default) {
      await supabase
        .from("crm_saved_views")
        .update({ is_default: false })
        .eq("workspace_id", workspaceId)
        .eq("entity_type", entity_type)
        .eq("is_default", true)
    }

    const { data, error } = await supabase
      .from("crm_saved_views")
      .insert({
        workspace_id: workspaceId,
        created_by: user.id,
        name,
        description,
        entity_type,
        filter_config: filter_config || {},
        sort_config: sort_config || null,
        column_config: column_config || null,
        is_shared: is_shared || false,
        is_default: is_default || false,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          Errors.conflict("A saved view with this name already exists", { field: "name" }),
          { status: 409 }
        )
      }
      return NextResponse.json(Errors.internal(error.message || "Failed to create saved view"), { status: 500 })
    }

    return NextResponse.json({
      view: data,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CRM] Error creating saved view:", error)
    return NextResponse.json(Errors.internal(error.message || "Failed to create saved view"), { status: 500 })
  }
}

