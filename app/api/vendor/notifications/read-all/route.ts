import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromSession } from "@/lib/vendor-session"

/**
 * POST /api/vendor/notifications/read-all
 * Mark all notifications as read for the current vendor
 */
export async function POST() {
  try {
    const vendor = await getVendorFromSession()
    if (!vendor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()
    const { error } = await supabase
      .from("vendor_notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("vendor_name", vendor.vendor_name)
      .eq("is_read", false)

    if (error) {
      console.error("Error marking all notifications as read:", error)
      return NextResponse.json(
        { error: "Failed to mark notifications as read" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
