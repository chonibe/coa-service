import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from("vendor_notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("vendor_name", vendorName)
      .eq("is_read", false)

    if (error) {
      console.error("Error marking all notifications as read:", error)
      return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error in mark all as read API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

