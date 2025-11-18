import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

export async function PUT(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { threadId } = params
    const supabase = createServiceClient()

    // Mark all messages in the thread as read
    const { error } = await supabase
      .from("vendor_messages")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("vendor_name", vendorName)
      .eq("thread_id", threadId)
      .eq("is_read", false)

    if (error) {
      console.error("Error marking messages as read:", error)
      return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error in mark as read API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

