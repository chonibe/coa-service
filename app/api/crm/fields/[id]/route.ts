import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Individual Custom Field API
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

    const body = await request.json()
    const {
      display_name,
      field_type,
      is_required,
      is_unique,
      default_value,
      options,
      validation_rules,
      visibility_rules,
      display_order,
      is_active,
    } = body

    const { data, error } = await supabase
      .from("crm_custom_fields")
      .update({
        display_name,
        field_type,
        is_required,
        is_unique,
        default_value,
        options,
        validation_rules,
        visibility_rules,
        display_order,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      field: data,
    })
  } catch (error: any) {
    console.error("[CRM] Error updating custom field:", error)
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
      .from("crm_custom_fields")
      .delete()
      .eq("id", params.id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("[CRM] Error deleting custom field:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

