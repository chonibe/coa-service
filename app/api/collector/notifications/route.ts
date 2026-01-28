import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

/**
 * GET: Fetch notifications for the current collector
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get collector from session
    const cookieStore = cookies()
    const collectorEmail = cookieStore.get("collector_email")?.value

    if (!collectorEmail) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "true"
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build query
    let query = supabase
      .from("collector_notifications")
      .select("*", { count: "exact" })
      .eq("recipient_email", collectorEmail)
      .eq("is_dismissed", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq("is_read", false)
    }

    const { data: notifications, count, error } = await query

    if (error) {
      console.error("[Notifications API] Error:", error)
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("collector_notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_email", collectorEmail)
      .eq("is_read", false)
      .eq("is_dismissed", false)

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      total: count || 0,
      unread_count: unreadCount || 0,
    })
  } catch (error: any) {
    console.error("[Notifications API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT: Mark notifications as read
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get collector from session
    const cookieStore = cookies()
    const collectorEmail = cookieStore.get("collector_email")?.value

    if (!collectorEmail) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { notification_ids, mark_all_read } = body

    if (mark_all_read) {
      // Mark all as read
      const { error } = await supabase
        .from("collector_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("recipient_email", collectorEmail)
        .eq("is_read", false)

      if (error) {
        console.error("[Notifications API] Mark all read error:", error)
        return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
      }
    } else if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from("collector_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("recipient_email", collectorEmail)
        .in("id", notification_ids)

      if (error) {
        console.error("[Notifications API] Mark read error:", error)
        return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Notifications API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Dismiss a notification (swipe to dismiss)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get collector from session
    const cookieStore = cookies()
    const collectorEmail = cookieStore.get("collector_email")?.value

    if (!collectorEmail) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get("id")

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID required" }, { status: 400 })
    }

    // Soft delete (dismiss)
    const { error } = await supabase
      .from("collector_notifications")
      .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
      .eq("recipient_email", collectorEmail)
      .eq("id", notificationId)

    if (error) {
      console.error("[Notifications API] Dismiss error:", error)
      return NextResponse.json({ error: "Failed to dismiss notification" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Notifications API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}
