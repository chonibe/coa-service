import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  if (!vendorName) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const { searchParams } = request.nextUrl
    const timeRange = searchParams.get("timeRange") || "30d"

    const supabase = createClient()

    // Calculate date range
    const now = new Date()
    let startDate: Date | null = new Date()
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
      case "all-time":
        startDate = null // All time - no date filter
        break
      default:
        startDate = new Date(0) // All time (fallback)
    }

    // Get payouts for this vendor
    let payoutsQuery = supabase
      .from("vendor_payouts")
      .select("id, amount, payout_date, created_at, status")
      .eq("vendor_name", vendorName)
    
    if (startDate) {
      payoutsQuery = payoutsQuery.gte("created_at", startDate.toISOString())
    }
    
    const { data: payouts, error: payoutsError } = await payoutsQuery.order("created_at", { ascending: true })

    if (payoutsError) {
      console.error("Error fetching vendor payouts:", payoutsError)
      return NextResponse.json({ error: "Failed to fetch payout data" }, { status: 500 })
    }

    // Get revenue data from line items for this vendor
    let lineItemsQuery = supabase
      .from("order_line_items_v2")
      .select("price, created_at")
      .eq("vendor_name", vendorName)
    
    if (startDate) {
      lineItemsQuery = lineItemsQuery.gte("created_at", startDate.toISOString())
    }
    
    const { data: lineItems, error: lineItemsError } = await lineItemsQuery.eq("fulfillment_status", "fulfilled")

    if (lineItemsError) {
      console.error("Error fetching line items:", lineItemsError)
    }

    // Group by date
    const trendsMap = new Map<string, { payoutAmount: number; revenueAmount: number; productCount: number }>()

    // Process payouts
    payouts?.forEach((payout) => {
      const date = new Date(payout.payout_date || payout.created_at).toISOString().split("T")[0]
      const existing = trendsMap.get(date) || { payoutAmount: 0, revenueAmount: 0, productCount: 0 }
      existing.payoutAmount += payout.amount || 0
      trendsMap.set(date, existing)
    })

    // Process revenue
    lineItems?.forEach((item) => {
      const date = new Date(item.created_at).toISOString().split("T")[0]
      const existing = trendsMap.get(date) || { payoutAmount: 0, revenueAmount: 0, productCount: 0 }
      const price = typeof item.price === "string" ? parseFloat(item.price || "0") : item.price || 0
      existing.revenueAmount += price
      existing.productCount += 1
      trendsMap.set(date, existing)
    })

    // Convert to array and sort
    const trends = Array.from(trendsMap.entries())
      .map(([date, data]) => ({
        date,
        payoutAmount: data.payoutAmount,
        revenueAmount: data.revenueAmount,
        productCount: data.productCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({ trends })
  } catch (error) {
    console.error("Error in vendor analytics route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}



