import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/crm/permissions"

/**
 * Conversation Tags API
 * Add or remove tags from conversations
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const { id: conversationId } = params
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permission
    try {
      await requirePermission(supabase, user.id, 'activities.write')
    } catch (permError: any) {
      return NextResponse.json(
        { error: permError.message || "Permission denied" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { tag_id } = body

    if (!tag_id) {
      return NextResponse.json(
        { error: "tag_id is required" },
        { status: 400 }
      )
    }

    // Verify tag exists
    const { data: tag, error: tagError } = await supabase
      .from("crm_tags")
      .select("id")
      .eq("id", tag_id)
      .single()

    if (tagError || !tag) {
      return NextResponse.json(
        { error: "Tag not found" },
        { status: 404 }
      )
    }

    // Add tag to conversation
    const { data, error } = await supabase
      .from("crm_conversation_tags")
      .insert({
        conversation_id: conversationId,
        tag_id: tag_id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Tag already added to conversation" },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({
      conversation_tag: data,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CRM Conversation Tags] Error:", error)
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

    const { id: conversationId } = params
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permission
    try {
      await requirePermission(supabase, user.id, 'activities.write')
    } catch (permError: any) {
      return NextResponse.json(
        { error: permError.message || "Permission denied" },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const tagId = searchParams.get("tag_id")

    if (!tagId) {
      return NextResponse.json(
        { error: "tag_id query parameter is required" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("crm_conversation_tags")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("tag_id", tagId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("[CRM Conversation Tags] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

