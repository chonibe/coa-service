import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { convertGBPToUSD } from "@/lib/utils"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)
  
  // Allow both admin and vendor access
  let isAdmin = false
  if (!vendorName) {
    const auth = guardAdminRequest(request)
    if (auth.kind !== "ok") {
      return auth.response
    }
    isAdmin = true
  }

  try {
    const { searchParams } = request.nextUrl
    const timeRange = searchParams.get("timeRange") || "30d"
    const queryVendorName = searchParams.get("vendorName")
    const limit = parseInt(searchParams.get("limit") || "20")
    
    // Use vendor from session if not admin, otherwise use query param
    const filterVendorName = isAdmin ? queryVendorName : vendorName

    const supabase = createClient()

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    switch (timeRange) {
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      case "90d":
        startDate.setDate(now.getDate() - 90)
        break
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate = new Date(0)
    }

    // Get payout items first
    let payoutItemsQuery = supabase
      .from("vendor_payout_items")
      .select("amount, line_item_id, created_at")
      .gte("created_at", startDate.toISOString())

    const { data: payoutItems, error: itemsError } = await payoutItemsQuery

    if (itemsError) {
      console.error("Error fetching payout items:", itemsError)
      return NextResponse.json({ error: "Failed to fetch product data" }, { status: 500 })
    }

    if (!payoutItems || payoutItems.length === 0) {
      return NextResponse.json({ products: [] })
    }

    // Get line item IDs
    const lineItemIds = payoutItems.map((item: any) => item.line_item_id).filter(Boolean)

    if (lineItemIds.length === 0) {
      return NextResponse.json({ products: [] })
    }

    // Get order line items
    let lineItemsQuery = supabase
      .from("order_line_items_v2")
      .select("line_item_id, product_id, name, price, vendor_name")
      .in("line_item_id", lineItemIds)

    if (filterVendorName) {
      lineItemsQuery = lineItemsQuery.eq("vendor_name", filterVendorName)
    }

    const { data: lineItems, error: lineItemsError } = await lineItemsQuery

    if (lineItemsError) {
      console.error("Error fetching line items:", lineItemsError)
      return NextResponse.json({ error: "Failed to fetch line item data" }, { status: 500 })
    }

    // Create a map of line_item_id to line item data
    const lineItemsMap = new Map()
    lineItems?.forEach((item: any) => {
      lineItemsMap.set(item.line_item_id, item)
    })

    // Create a map of line_item_id to payout items (for aggregation)
    const payoutItemsByLineItem = new Map()
    payoutItems.forEach((payoutItem: any) => {
      const lineItemId = payoutItem.line_item_id
      if (!payoutItemsByLineItem.has(lineItemId)) {
        payoutItemsByLineItem.set(lineItemId, [])
      }
      payoutItemsByLineItem.get(lineItemId).push(payoutItem)
    })

    // Aggregate by product
    const productMap = new Map<
      string,
      { productId: string; productTitle: string; payoutAmount: number; revenueAmount: number; salesCount: number }
    >()

    lineItems?.forEach((lineItem: any) => {
      const productId = lineItem.product_id || "unknown"
      const existing = productMap.get(productId) || {
        productId,
        productTitle: lineItem.name || `Product ${productId}`,
        payoutAmount: 0,
        revenueAmount: 0,
        salesCount: 0,
      }

      // Sum up all payout amounts for this line item
      const payoutItemsForLineItem = payoutItemsByLineItem.get(lineItem.line_item_id) || []
      payoutItemsForLineItem.forEach((payoutItem: any) => {
        existing.payoutAmount += convertGBPToUSD(payoutItem.amount || 0)
      })

      const price = typeof lineItem.price === "string" ? parseFloat(lineItem.price || "0") : lineItem.price || 0
      existing.revenueAmount += convertGBPToUSD(price)
      existing.salesCount += 1

      productMap.set(productId, existing)
    })

    // Convert to array, calculate payout percentage, and sort
    const products = Array.from(productMap.values())
      .map((p) => ({
        ...p,
        payoutPercentage: p.revenueAmount > 0 ? (p.payoutAmount / p.revenueAmount) * 100 : 0,
      }))
      .sort((a, b) => b.payoutAmount - a.payoutAmount)
      .slice(0, limit)

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Error in products analytics route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
