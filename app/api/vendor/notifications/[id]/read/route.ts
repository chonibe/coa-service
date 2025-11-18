import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = params
    const supabase = createServiceClient()

    const { error } = await supabase
      .from("vendor_notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("vendor_name", vendorName)

    if (error) {
      console.error("Error marking notification as read:", error)
      return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error in mark notification as read API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

