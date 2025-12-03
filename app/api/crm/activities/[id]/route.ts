import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Individual Activity API
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
      title,
      description,
      assigned_to_user_id,
      due_date,
      is_completed,
      completed_at,
      priority,
      metadata,
      attachments,
    } = body

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (assigned_to_user_id !== undefined) updateData.assigned_to_user_id = assigned_to_user_id
    if (due_date !== undefined) updateData.due_date = due_date
    if (is_completed !== undefined) {
      updateData.is_completed = is_completed
      if (is_completed && !completed_at) {
        updateData.completed_at = new Date().toISOString()
      } else if (!is_completed) {
        updateData.completed_at = null
      }
    }
    if (completed_at !== undefined) updateData.completed_at = completed_at
    if (priority !== undefined) updateData.priority = priority
    if (metadata !== undefined) updateData.metadata = metadata
    if (attachments !== undefined) updateData.attachments = attachments

    const { data, error } = await supabase
      .from("crm_activities")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      activity: data,
    })
  } catch (error: any) {
    console.error("[CRM] Error updating activity:", error)
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
      .from("crm_activities")
      .delete()
      .eq("id", params.id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("[CRM] Error deleting activity:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

