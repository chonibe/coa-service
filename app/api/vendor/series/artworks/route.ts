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

    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Fetch all series members for this vendor
    // We join with artwork_series to filter by vendor_id and get series name
    // We join with vendor_product_submissions to get artwork details
    const { data: members, error: membersError } = await supabase
      .from("artwork_series_members")
      .select(`
        id,
        series_id,
        display_order,
        is_locked,
        artwork_series!inner (
          id,
          name,
          vendor_id
        ),
        vendor_product_submissions (
          id,
          product_data
        )
      `)
      .eq("artwork_series.vendor_id", vendor.id)
      .order("created_at", { ascending: false })

    if (membersError) {
      console.error("Error fetching all artworks:", membersError)
      return NextResponse.json({ error: "Failed to fetch artworks" }, { status: 500 })
    }

    // Map to clean structure
    const artworks = members.map((m: any) => {
      const submission = m.vendor_product_submissions
      let image = null
      let title = "Untitled"

      if (submission?.product_data) {
        title = submission.product_data.title || title
        if (Array.isArray(submission.product_data.images) && submission.product_data.images.length > 0) {
          const firstImg = submission.product_data.images[0]
          image = typeof firstImg === 'string' ? firstImg : firstImg.src
        }
      }

      return {
        id: m.id,
        series_id: m.series_id,
        series_name: m.artwork_series.name,
        is_locked: m.is_locked,
        title,
        image,
      }
    })

    return NextResponse.json({ artworks })
  } catch (error: any) {
    console.error("Error in GET /api/vendor/series/artworks:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

