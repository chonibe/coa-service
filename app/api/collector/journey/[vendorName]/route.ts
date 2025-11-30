import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { calculateSeriesCompletion } from "@/lib/series/completion-calculator"

/**
 * GET /api/collector/journey/[vendorName]
 * Get collector's view of an artist's journey
 * Shows completed series for this collector, highlights unlocked series based on collector's purchases
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { vendorName: string } }
) {
  try {
    const supabase = createClient()
    const vendorName = decodeURIComponent(params.vendorName)

    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Get customer email from query params (or from session in production)
    const { searchParams } = new URL(request.url)
    const customerEmail = searchParams.get("email")

    // Fetch all series for this vendor
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

    // Get collector's purchased products if email provided
    let purchasedProductIds: Set<string> = new Set()
    if (customerEmail) {
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("customer_email", customerEmail)

      if (orders && orders.length > 0) {
        const orderIds = orders.map((o) => o.id)
        const { data: lineItems } = await supabase
          .from("order_line_items_v2")
          .select("product_id")
          .in("order_id", orderIds)
          .eq("status", "fulfilled")

        if (lineItems) {
          purchasedProductIds = new Set(
            lineItems.map((item) => item.product_id?.toString()).filter(Boolean)
          )
        }
      }
    }

    // Calculate completion progress and collector progress for each series
    const seriesWithProgress = await Promise.all(
      (series || []).map(async (s) => {
        try {
          const progress = await calculateSeriesCompletion(s.id)

          // Check which artworks in this series the collector owns
          const { data: members } = await supabase
            .from("artwork_series_members")
            .select("shopify_product_id")
            .eq("series_id", s.id)
            .in("shopify_product_id", Array.from(purchasedProductIds))

          const collectorOwnedCount = members?.length || 0
          const collectorProgress = s.completion_progress?.total_artworks
            ? (collectorOwnedCount / s.completion_progress.total_artworks) * 100
            : 0

          return {
            ...s,
            completion_progress: progress,
            collector_owned_count: collectorOwnedCount,
            collector_progress: collectorProgress,
            is_unlocked: collectorOwnedCount > 0 || s.unlock_type === "any_purchase",
          }
        } catch (error) {
          console.error(`Error calculating progress for series ${s.id}:`, error)
          return {
            ...s,
            completion_progress: s.completion_progress || {
              total_artworks: 0,
              sold_artworks: 0,
              percentage_complete: 0,
            },
            collector_owned_count: 0,
            collector_progress: 0,
            is_unlocked: s.unlock_type === "any_purchase",
          }
        }
      })
    )

    // Get journey map settings
    const { data: mapSettings } = await supabase
      .from("journey_map_settings")
      .select("*")
      .eq("vendor_id", vendor.id)
      .single()

    return NextResponse.json({
      vendor: {
        id: vendor.id,
        vendor_name: vendor.vendor_name,
      },
      series: seriesWithProgress,
      mapSettings: mapSettings || null,
      collectorEmail: customerEmail,
    })
  } catch (error: any) {
    console.error("Error in GET /api/collector/journey/[vendorName]:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
