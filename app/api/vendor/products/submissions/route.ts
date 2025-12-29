import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
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
      query = query.eq("status", status as "pending" | "approved" | "rejected" | "published")
    }

    const { data: submissions, error } = await query

    if (error) {
      console.error("Error fetching submissions:", error)
      return NextResponse.json(
        { error: "Failed to fetch submissions", message: error.message },
        { status: 500 },
      )
    }

    // Get shopify_product_ids from submissions to fetch edition data
    // Handle both string and number IDs
    const shopifyProductIds = (submissions || [])
      .map((s: any) => {
        const id = s.shopify_product_id
        return id !== null && id !== undefined ? id.toString() : null
      })
      .filter((id: any) => id !== null && id !== undefined) as string[]

    // Fetch edition sizes from products table
    let editionSizeMap = new Map<string, number | null>()
    if (shopifyProductIds.length > 0) {
      const { data: productEditions } = await supabase
        .from("products")
        .select("product_id, edition_size")
        .in("product_id", shopifyProductIds as any)

      productEditions?.forEach((p) => {
        let editionSize: number | null = null
        if (p.edition_size) {
          const parsed = parseInt(p.edition_size.toString(), 10)
          if (!isNaN(parsed) && parsed > 0) {
            editionSize = parsed
          }
        }
        const productId = p.product_id?.toString() || ""
        if (productId) {
          editionSizeMap.set(productId, editionSize)
        }
      })
    }

    // Count sold items (fulfilled/active line items) for each product
    let soldCountMap = new Map<string, number>()
    if (shopifyProductIds.length > 0) {
      const { data: soldCounts } = await supabase
        .from("order_line_items_v2")
        .select("product_id")
        .in("product_id", shopifyProductIds as any)
        .eq("status", "active")

      soldCounts?.forEach((item) => {
        const productId = item.product_id?.toString() || ""
        if (productId) {
          const current = soldCountMap.get(productId) || 0
          soldCountMap.set(productId, current + 1)
        }
      })
    }

    // Map submissions to include series metadata and edition data
    const submissionsWithSeries = (submissions || []).map((submission: any) => {
      const members = submission.artwork_series_members || []
      // Get the first series (in case of duplicates, we'll show the first one)
      const firstMember = members[0]
      const seriesMetadata = firstMember?.artwork_series ? {
        series_id: firstMember.series_id,
        series_name: firstMember.artwork_series.name,
        unlock_type: firstMember.artwork_series.unlock_type,
      } : null

      // Get edition data for this submission
      const shopifyProductId = submission.shopify_product_id?.toString()
      const editionSize = shopifyProductId ? editionSizeMap.get(shopifyProductId) ?? null : null
      const soldCount = shopifyProductId ? soldCountMap.get(shopifyProductId) ?? 0 : 0

      // Remove the nested members array from the response
      const { artwork_series_members, ...submissionData } = submission
      return {
        ...submissionData,
        series_metadata: seriesMetadata,
        edition_size: editionSize,
        sold_count: soldCount,
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

