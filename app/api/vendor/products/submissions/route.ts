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

    // Get vendor info first
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Build query with series information
    let query = supabase
      .from("vendor_product_submissions")
      .select(`
        *,
        artwork_series_members (
          id,
          series_id,
          artwork_series (
            id,
            name,
            unlock_type
          )
        )
      `)
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

    // Map submissions to include series metadata
    const submissionsWithSeries = (submissions || []).map((submission: any) => {
      const members = submission.artwork_series_members || []
      // Get the first series (in case of duplicates, we'll show the first one)
      const firstMember = members[0]
      const seriesMetadata = firstMember?.artwork_series ? {
        series_id: firstMember.series_id,
        series_name: firstMember.artwork_series.name,
        unlock_type: firstMember.artwork_series.unlock_type,
      } : null

      // Remove the nested members array from the response
      const { artwork_series_members, ...submissionData } = submission
      return {
        ...submissionData,
        series_metadata: seriesMetadata,
      }
    })

    return NextResponse.json({
      success: true,
      submissions: submissionsWithSeries,
    })
  } catch (error: any) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json(
      { error: "Failed to fetch submissions", message: error.message },
      { status: 500 },
    )
  }
}

