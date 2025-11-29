import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  if (!vendorName) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Get all series with unlock_type = 'vip'
    const { data: vipSeries, error: seriesError } = await supabase
      .from("artwork_series")
      .select("id, name, unlock_type, unlock_config")
      .eq("vendor_id", vendor.id)
      .eq("unlock_type", "vip")
      .eq("is_active", true)

    if (seriesError) {
      console.error("Error fetching VIP series:", seriesError)
      return NextResponse.json(
        { error: "Failed to fetch VIP series", message: seriesError.message },
        { status: 500 }
      )
    }

    // Get all artworks from VIP series
    const vipSeriesIds = (vipSeries || []).map((s) => s.id)
    let artworks: any[] = []

    if (vipSeriesIds.length > 0) {
      // Get series members
      const { data: members, error: membersError } = await supabase
        .from("artwork_series_members")
        .select("submission_id, series_id")
        .in("series_id", vipSeriesIds)

      if (membersError) {
        console.error("Error fetching series members:", membersError)
      } else {
        // Get submissions for these members
        const submissionIds = (members || []).map((m) => m.submission_id)
        if (submissionIds.length > 0) {
          const { data: submissions, error: submissionsError } = await supabase
            .from("vendor_product_submissions")
            .select("id, product_data, status")
            .eq("vendor_id", vendor.id)
            .in("id", submissionIds)
            .in("status", ["approved", "published"])

          if (submissionsError) {
            console.error("Error fetching submissions:", submissionsError)
          } else {
            // Map submissions to artworks with series info
            artworks = (submissions || []).map((submission) => {
              const productData = submission.product_data as any
              const member = members?.find((m) => m.submission_id === submission.id)
              const series = vipSeries?.find((s) => s.id === member?.series_id)

              return {
                id: submission.id,
                title: productData.title || "Untitled Artwork",
                series_name: series?.name,
                series_id: series?.id,
                price: productData.variants?.[0]?.price,
              }
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      artworks,
    })
  } catch (error: any) {
    console.error("Error fetching VIP artworks:", error)
    return NextResponse.json(
      { error: "Failed to fetch VIP artworks", message: error.message },
      { status: 500 }
    )
  }
}

