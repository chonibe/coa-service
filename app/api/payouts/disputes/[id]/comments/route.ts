import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { cookies } from "next/headers"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { text, isInternal } = body

    // Check if user is admin or vendor
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)
    const supabase = createClient()

    // Try admin auth first
    let isAdmin = false
    try {
      const auth = guardAdminRequest(request)
      if (auth.kind === "ok") {
        isAdmin = true
      }
    } catch {
      // Not admin, check vendor
      if (!vendorName) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    // Get dispute to check vendor
    const { data: dispute } = await supabase
      .from("payout_disputes")
      .select("vendor_name")
      .eq("id", params.id)
      .single()

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 })
    }

    // Verify vendor access
    if (!isAdmin && vendorName !== dispute.vendor_name) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Vendors can't create internal comments
    if (!isAdmin && isInternal) {
      return NextResponse.json({ error: "Only admins can create internal comments" }, { status: 403 })
    }

    const { data: comment, error } = await supabase
      .from("payout_dispute_comments")
      .insert({
        dispute_id: params.id,
        text,
        author: isAdmin ? "Admin" : vendorName || "Vendor",
        is_internal: isInternal || false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating comment:", error)
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error("Error in dispute comment route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

