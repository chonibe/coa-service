import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromSession } from "@/lib/vendor-session"

/**
 * POST /api/vendor/notifications/[id]/read
 * Mark a notification as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      .eq("id", params.id)
      .eq("vendor_name", vendor.vendor_name)

    if (error) {
      console.error("Error marking notification as read:", error)
      return NextResponse.json(
        { error: "Failed to mark notification as read" },
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
