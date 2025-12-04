import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
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
  const supabase = createClient()
  
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
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const body = await request.json()
    const {
      name,
      description,
      entity_type,
      filters,
      sort,
      is_shared,
      is_default,
    } = body

    if (!name || !entity_type) {
      return NextResponse.json(
        { error: "name and entity_type are required" },
        { status: 400 }
      )
    }

    // Get current user ID (you'll need to implement this based on your auth)
    // For now, we'll use a placeholder
    const created_by_user_id = null // TODO: Get from session

    // If setting as default, unset other defaults for this entity type and user
    if (is_default && created_by_user_id) {
      await supabase
        .from("crm_saved_views")
        .update({ is_default: false })
        .eq("entity_type", entity_type)
        .eq("created_by_user_id", created_by_user_id)
        .eq("is_default", true)
    }

    const { data, error } = await supabase
      .from("crm_saved_views")
      .insert({
        name,
        description,
        entity_type,
        filters: filters || {},
        sort: sort || [],
        is_shared: is_shared || false,
        is_default: is_default || false,
        created_by_user_id,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      view: data,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CRM] Error creating saved view:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

