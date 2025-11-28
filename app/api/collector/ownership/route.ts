import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { calculateLoyaltyPoints, calculateVIPTier } from "@/lib/unlocks/vip"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const collectorId = searchParams.get("collector_id")
    const seriesId = searchParams.get("series_id")

    if (!collectorId) {
      return NextResponse.json({ error: "collector_id is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Get collector's orders and line items
    // This assumes we have a way to identify collectors (e.g., customer_id, account_number)
    const { data: orders, error: ordersError } = await supabase
      .from("orders_v2")
      .select("id, created_at, account_number")
      .eq("account_number", collectorId) // Assuming account_number is the collector identifier
      .order("created_at", { ascending: true })

    if (ordersError) {
      console.error("Error fetching orders:", ordersError)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        ownedArtworkIds: [],
        loyaltyPoints: 0,
        vipTier: 0,
        purchaseCount: 0,
      })
    }

    // Get line items for these orders
    const orderIds = orders.map((o) => o.id)
    let query = supabase
      .from("order_line_items_v2")
      .select("submission_id, shopify_product_id, created_at")
      .in("order_id", orderIds)

    // Filter by series if specified
    if (seriesId) {
      query = query.eq("series_id", seriesId)
    }

    const { data: lineItems, error: lineItemsError } = await query

    if (lineItemsError) {
      console.error("Error fetching line items:", lineItemsError)
      return NextResponse.json({ error: "Failed to fetch line items" }, { status: 500 })
    }

    // Extract owned artwork IDs
    const ownedArtworkIds = [
      ...new Set(
        (lineItems || [])
          .map((item) => item.submission_id || item.shopify_product_id)
          .filter(Boolean)
      ),
    ] as string[]

    const purchaseCount = lineItems?.length || 0
    const firstPurchaseDate = orders[0]?.created_at
      ? new Date(orders[0].created_at)
      : undefined

    // Calculate loyalty metrics
    const loyaltyPoints = calculateLoyaltyPoints(purchaseCount, firstPurchaseDate)
    const vipTier = calculateVIPTier(loyaltyPoints)

    return NextResponse.json({
      ownedArtworkIds,
      loyaltyPoints,
      vipTier,
      purchaseCount,
      firstPurchaseDate: firstPurchaseDate?.toISOString(),
    })
  } catch (error: any) {
    console.error("Error in GET /api/collector/ownership:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

