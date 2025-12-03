import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Saved View Detail API - Get, update, delete specific saved view
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const { data, error } = await supabase
      .from("crm_saved_views")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Saved view not found" },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({
      view: data,
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching saved view:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const body = await request.json()
    const {
      name,
      description,
      filters,
      sort,
      is_shared,
      is_default,
    } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (filters !== undefined) updateData.filters = filters
    if (sort !== undefined) updateData.sort = sort
    if (is_shared !== undefined) updateData.is_shared = is_shared
    if (is_default !== undefined) updateData.is_default = is_default

    // If setting as default, unset other defaults
    if (is_default) {
      const { data: currentView } = await supabase
        .from("crm_saved_views")
        .select("entity_type, created_by_user_id")
        .eq("id", params.id)
        .single()

      if (currentView) {
        await supabase
          .from("crm_saved_views")
          .update({ is_default: false })
          .eq("entity_type", currentView.entity_type)
          .eq("created_by_user_id", currentView.created_by_user_id)
          .eq("is_default", true)
          .neq("id", params.id)
      }
    }

    const { data, error } = await supabase
      .from("crm_saved_views")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      view: data,
    })
  } catch (error: any) {
    console.error("[CRM] Error updating saved view:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
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

    const { error } = await supabase
      .from("crm_saved_views")
      .delete()
      .eq("id", params.id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("[CRM] Error deleting saved view:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

