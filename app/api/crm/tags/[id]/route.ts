import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/crm/permissions"

/**
 * Tag Management API
 * Update or delete a tag
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

    // Check permission
    try {
      await requirePermission(supabase, user.id, 'lists.manage')
    } catch (permError: any) {
      return NextResponse.json(
        { error: permError.message || "Permission denied" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, color } = body

    const updateData: any = {}
    if (name !== undefined) {
      updateData.name = name.trim()
    }
    if (color !== undefined) {
      updateData.color = color
    }

    const { data, error } = await supabase
      .from("crm_tags")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Tag with this name already exists" },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({
      tag: data,
    })
  } catch (error: any) {
    console.error("[CRM Tags] Error updating tag:", error)
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

    const { id } = params
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permission
    try {
      await requirePermission(supabase, user.id, 'lists.manage')
    } catch (permError: any) {
      return NextResponse.json(
        { error: permError.message || "Permission denied" },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from("crm_tags")
      .delete()
      .eq("id", id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("[CRM Tags] Error deleting tag:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

