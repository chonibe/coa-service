import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

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

    const supabase = createClient()

    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const seriesId = params.id

    // Verify series belongs to vendor
    const { data: existingSeries, error: checkError } = await supabase
      .from("artwork_series")
      .select("id")
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .single()

    if (checkError || !existingSeries) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    const body = await request.json()
    const { memberIds } = body

    if (!Array.isArray(memberIds)) {
      return NextResponse.json({ error: "memberIds must be an array" }, { status: 400 })
    }

    // Update display_order for each member
    const updates = memberIds.map((memberId: string, index: number) => {
      return supabase
        .from("artwork_series_members")
        .update({ display_order: index })
        .eq("id", memberId)
        .eq("series_id", seriesId)
    })

    const results = await Promise.all(updates)

    // Check for errors
    const errors = results.filter((result) => result.error)
    if (errors.length > 0) {
      console.error("Error reordering members:", errors)
      return NextResponse.json({ error: "Failed to reorder some members" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in PUT /api/vendor/series/[id]/reorder:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

