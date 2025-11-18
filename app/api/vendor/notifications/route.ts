import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createServiceClient()
    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get("unread_only") === "true"
    const limit = parseInt(searchParams.get("limit") || "50")

    let query = supabase
      .from("vendor_notifications")
      .select("*")
      .eq("vendor_name", vendorName)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq("is_read", false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error("Error fetching notifications:", error)
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("vendor_notifications")
      .select("*", { count: "exact", head: true })
      .eq("vendor_name", vendorName)
      .eq("is_read", false)

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    })
  } catch (error) {
    console.error("Unexpected error in notifications API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

