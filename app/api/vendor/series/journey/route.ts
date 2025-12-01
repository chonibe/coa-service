import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"
import { calculateSeriesCompletion } from "@/lib/series/completion-calculator"

/**
 * GET /api/vendor/series/journey
 * Fetch journey map data for a vendor
 * Returns all series with journey positions, connections, and completion status
 */
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
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Fetch all series for this vendor (including inactive for journey map)
    const { data: series, error: seriesError } = await supabase
      .from("artwork_series")
      .select("*")
      .eq("vendor_id", vendor.id)
      .order("milestone_order", { ascending: true, nullsLast: true })
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (seriesError) {
      console.error("Error fetching series:", seriesError)
      return NextResponse.json({ error: "Failed to fetch series" }, { status: 500 })
    }

    // Calculate completion progress for each series
    const seriesWithProgress = await Promise.all(
      (series || []).map(async (s) => {
        try {
          // Calculate real-time completion progress
          const progress = await calculateSeriesCompletion(s.id)

          // Fetch series members (artworks)
          const { data: membersData } = await supabase
            .from("artwork_series_members")
            .select(`
              id,
              series_id,
              display_order,
              is_locked,
              vendor_product_submissions (
                id,
                product_data
              )
            `)
            .eq("series_id", s.id)
            .order("display_order", { ascending: true })

          // Map members to formatted structure
          const members = (membersData || []).map((m: any) => {
            const submission = m.vendor_product_submissions
            let images: string[] = []
            let title = "Artwork"

            if (submission?.product_data) {
              title = submission.product_data.title || title
              if (Array.isArray(submission.product_data.images)) {
                images = submission.product_data.images.map((img: any) => 
                  typeof img === 'string' ? img : img.src
                ).filter(Boolean)
              }
            }

            return {
              id: m.id,
              series_id: m.series_id,
              display_order: m.display_order,
              is_locked: m.is_locked,
              submissions: submission ? {
                id: submission.id,
                title,
                images
              } : null
            }
          })

          // Update progress in database (non-blocking)
          supabase
            .from("artwork_series")
            .update({ completion_progress: progress })
            .eq("id", s.id)
            .then(() => {}) // Fire and forget

          return {
            ...s,
            completion_progress: progress,
            members: members || []
          }
        } catch (error) {
          console.error(`Error calculating progress for series ${s.id}:`, error)
          // Return series with existing progress or default
          return {
            ...s,
            completion_progress: s.completion_progress || {
              total_artworks: 0,
              sold_artworks: 0,
              percentage_complete: 0,
            },
          }
        }
      })
    )

    // Get journey map settings for this vendor
    const { data: mapSettings } = await supabase
      .from("journey_map_settings")
      .select("*")
      .eq("vendor_id", vendor.id)
      .single()

    return NextResponse.json({
      series: seriesWithProgress,
      mapSettings: mapSettings || null,
    })
  } catch (error: any) {
    console.error("Error in GET /api/vendor/series/journey:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
