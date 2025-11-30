import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"
import { calculateSeriesCompletion } from "@/lib/series/completion-calculator"

/**
 * GET /api/vendor/series/[id]/completion
 * Get detailed completion progress for a specific series
 * Returns sold vs total artworks, completion percentage, and unsold artworks
 */
export async function GET(
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
    const { data: series, error: seriesError } = await supabase
      .from("artwork_series")
      .select("id, name, milestone_config, completed_at")
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .single()

    if (seriesError || !series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    // Calculate completion progress
    const progress = await calculateSeriesCompletion(seriesId)

    // Get all artworks in series
    const { data: members, error: membersError } = await supabase
      .from("artwork_series_members")
      .select("id, shopify_product_id, submission_id, display_order")
      .eq("series_id", seriesId)
      .order("display_order", { ascending: true })

    if (membersError) {
      console.error("Error fetching series members:", membersError)
    }

    // Get sold product IDs
    const productIds = (members || [])
      .map((m) => m.shopify_product_id)
      .filter((id): id is string => id !== null && id !== undefined)

    let soldProductIds: Set<string> = new Set()
    if (productIds.length > 0) {
      const { data: soldItems } = await supabase
        .from("order_line_items_v2")
        .select("product_id")
        .in("product_id", productIds)
        .eq("status", "fulfilled")

      soldProductIds = new Set(
        soldItems?.map((item) => item.product_id?.toString()).filter(Boolean) || []
      )
    }

    // Enrich members with sold status
    const artworksWithStatus = (members || []).map((member) => {
      const isSold = member.shopify_product_id
        ? soldProductIds.has(member.shopify_product_id)
        : false

      return {
        id: member.id,
        shopify_product_id: member.shopify_product_id,
        submission_id: member.submission_id,
        display_order: member.display_order,
        is_sold: isSold,
      }
    })

    // Get milestone config
    const milestoneConfig = (series.milestone_config as any) || {
      completion_type: "all_sold",
      auto_complete: true,
    }

    return NextResponse.json({
      progress,
      milestoneConfig,
      completedAt: series.completed_at,
      artworks: artworksWithStatus,
      unsoldArtworks: artworksWithStatus.filter((a) => !a.is_sold),
      soldArtworks: artworksWithStatus.filter((a) => a.is_sold),
    })
  } catch (error: any) {
    console.error("Error in GET /api/vendor/series/[id]/completion:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
