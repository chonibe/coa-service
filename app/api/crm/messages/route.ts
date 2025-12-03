import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET: Fetch messages for a conversation
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const searchParams = request.nextUrl.searchParams
    const conversationId = searchParams.get("conversation_id")

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversation_id is required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("crm_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({
      messages: data || [],
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching messages:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// POST: Send a new message
export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const body = await request.json()
    const { conversation_id, content, direction = "outbound", external_id, metadata } = body

    if (!conversation_id || !content) {
      return NextResponse.json(
        { error: "conversation_id and content are required" },
        { status: 400 }
      )
    }

    // Insert message
    const { data, error } = await supabase
      .from("crm_messages")
      .insert({
        conversation_id,
        direction,
        content,
        external_id,
        metadata,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Update conversation status to 'open' if it was closed
    await supabase
      .from("crm_conversations")
      .update({ status: "open" })
      .eq("id", conversation_id)
      .eq("status", "closed")

    return NextResponse.json({
      message: data,
    })
  } catch (error: any) {
    console.error("[CRM] Error creating message:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

