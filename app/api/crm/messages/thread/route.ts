import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"

/**
 * Message Thread API
 * Get messages organized by thread hierarchy
 */

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)

  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const threadId = searchParams.get("thread_id")
    const conversationId = searchParams.get("conversation_id")

    if (!threadId && !conversationId) {
      return NextResponse.json(
        { error: "thread_id or conversation_id is required" },
        { status: 400 }
      )
    }

    let query = supabase
      .from("crm_messages")
      .select("*")
      .order("thread_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (threadId) {
      query = query.eq("thread_id", threadId)
    } else if (conversationId) {
      // Get all messages in conversation, grouped by thread
      query = query.eq("conversation_id", conversationId)
    }

    const { data: messages, error } = await query

    if (error) {
      throw error
    }

    // Organize messages into tree structure
    const messageMap = new Map<string, any>()
    const rootMessages: any[] = []

    // First pass: create map of all messages
    messages?.forEach((msg: any) => {
      messageMap.set(msg.id, {
        ...msg,
        children: [],
      })
    })

    // Second pass: build tree structure
    messages?.forEach((msg: any) => {
      const messageNode = messageMap.get(msg.id)!
      if (msg.parent_message_id) {
        const parent = messageMap.get(msg.parent_message_id)
        if (parent) {
          parent.children.push(messageNode)
        } else {
          // Orphaned message (parent not found), treat as root
          rootMessages.push(messageNode)
        }
      } else {
        // Root message
        rootMessages.push(messageNode)
      }
    })

    // Sort root messages by created_at
    rootMessages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    return NextResponse.json({
      thread_id: threadId,
      messages: rootMessages,
      flat_messages: messages, // Also return flat list for easier access
    })
  } catch (error: any) {
    console.error("[CRM Thread] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

