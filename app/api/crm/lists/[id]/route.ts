import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * List Detail API - Get, update, delete specific list
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
      .from("crm_lists")
      .select(`
        *,
        crm_list_attributes (
          id,
          field_name,
          display_name,
          field_type,
          is_required,
          default_value,
          options,
          display_order
        )
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "List not found" },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({
      list: data,
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching list:", error)
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
      color,
      icon,
    } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (color !== undefined) updateData.color = color
    if (icon !== undefined) updateData.icon = icon

    const { data, error } = await supabase
      .from("crm_lists")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      list: data,
    })
  } catch (error: any) {
    console.error("[CRM] Error updating list:", error)
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

    // Check if list is system list
    const { data: list } = await supabase
      .from("crm_lists")
      .select("is_system")
      .eq("id", params.id)
      .single()

    if (list?.is_system) {
      return NextResponse.json(
        { error: "Cannot delete system lists" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("crm_lists")
      .delete()
      .eq("id", params.id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("[CRM] Error deleting list:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

