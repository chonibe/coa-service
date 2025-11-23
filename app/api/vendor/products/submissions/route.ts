import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { searchParams } = request.nextUrl
    const status = searchParams.get("status")

    // Build query
    let query = supabase
      .from("vendor_product_submissions")
      .select("*")
      .eq("vendor_name", vendorName)
      .order("submitted_at", { ascending: false })

    // Filter by status if provided
    if (status && ["pending", "approved", "rejected", "published"].includes(status)) {
      query = query.eq("status", status)
    }

    const { data: submissions, error } = await query

    if (error) {
      console.error("Error fetching submissions:", error)
      return NextResponse.json(
        { error: "Failed to fetch submissions", message: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      submissions: submissions || [],
    })
  } catch (error: any) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json(
      { error: "Failed to fetch submissions", message: error.message },
      { status: 500 },
    )
  }
}

