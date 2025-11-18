import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { randomUUID } from "crypto"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createServiceClient()
    const searchParams = request.nextUrl.searchParams
    const threadId = searchParams.get("thread_id")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    if (threadId) {
      // Get messages for a specific thread
      const { data: messages, error } = await supabase
        .from("vendor_messages")
        .select("*")
        .eq("vendor_name", vendorName)
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error("Error fetching thread messages:", error)
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
      }

      return NextResponse.json({ messages: messages || [], threadId })
    } else {
      // Get all message threads (grouped by thread_id)
      const { data: allMessages, error } = await supabase
        .from("vendor_messages")
        .select("*")
        .eq("vendor_name", vendorName)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching messages:", error)
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
      }

      // Group messages by thread_id and get the latest message from each thread
      const threadsMap = new Map<string, any>()
      const unreadCounts = new Map<string, number>()

      allMessages?.forEach((message) => {
        const threadId = message.thread_id
        if (!threadsMap.has(threadId) || new Date(message.created_at) > new Date(threadsMap.get(threadId).created_at)) {
          threadsMap.set(threadId, message)
        }
        if (!message.is_read) {
          unreadCounts.set(threadId, (unreadCounts.get(threadId) || 0) + 1)
        }
      })

      const threads = Array.from(threadsMap.values())
        .map((message) => ({
          threadId: message.thread_id,
          subject: message.subject,
          lastMessage: message.body,
          lastMessageAt: message.created_at,
          senderType: message.sender_type,
          senderId: message.sender_id,
          unreadCount: unreadCounts.get(message.thread_id) || 0,
        }))
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
        .slice(offset, offset + limit)

      // Get total unread count
      const totalUnread = Array.from(unreadCounts.values()).reduce((sum, count) => sum + count, 0)

      return NextResponse.json({
        threads,
        totalUnread,
        page,
        limit,
        total: threadsMap.size,
      })
    }
  } catch (error) {
    console.error("Unexpected error in messages API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { threadId, recipientType, recipientId, subject, body: messageBody } = body

    if (!messageBody) {
      return NextResponse.json({ error: "Message body is required" }, { status: 400 })
    }

    const supabase = createServiceClient()
    const newThreadId = threadId || randomUUID()

    const { data: message, error } = await supabase
      .from("vendor_messages")
      .insert({
        vendor_name: vendorName,
        thread_id: newThreadId,
        sender_type: "vendor",
        sender_id: vendorName,
        recipient_type: recipientType || "admin",
        recipient_id: recipientId || null,
        subject: subject || null,
        body: messageBody,
        is_read: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating message:", error)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    return NextResponse.json({ message, threadId: newThreadId }, { status: 201 })
  } catch (error) {
    console.error("Unexpected error in messages API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

