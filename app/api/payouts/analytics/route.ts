import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { convertToUSD } from "@/lib/currency-converter"
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
    
    // Use vendor from session if not admin, otherwise use query param
    const filterVendorName = isAdmin ? queryVendorName : vendorName

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

    // Build query
    let query = supabase
      .from("vendor_payouts")
      .select("id, amount, payout_date, created_at, vendor_name, status")
    
    if (startDate) {
      query = query.gte("created_at", startDate.toISOString())
    }
    
    query = query.order("created_at", { ascending: true })

    if (filterVendorName) {
      query = query.eq("vendor_name", filterVendorName)
    }

    const { data: payouts, error: payoutsError } = await query

    if (payoutsError) {
      console.error("Error fetching payouts:", payoutsError)
      return NextResponse.json({ error: "Failed to fetch payout data" }, { status: 500 })
    }

    // Get revenue data from line items
    let revenueQuery = supabase
      .from("order_line_items_v2")
      .select("price, created_at, vendor_name")
      .gte("created_at", startDate.toISOString())
      .eq("fulfillment_status", "fulfilled")

    if (filterVendorName) {
      revenueQuery = revenueQuery.eq("vendor_name", filterVendorName)
    }

    const { data: lineItems, error: lineItemsError } = await revenueQuery

    if (lineItemsError) {
      console.error("Error fetching line items:", lineItemsError)
    }

    // Group by date
    const trendsMap = new Map<string, { payoutAmount: number; revenueAmount: number; productCount: number }>()

    // Process payouts (all amounts are in USD)
    for (const payout of payouts || []) {
      const date = new Date(payout.payout_date || payout.created_at).toISOString().split("T")[0]
      const existing = trendsMap.get(date) || { payoutAmount: 0, revenueAmount: 0, productCount: 0 }
      existing.payoutAmount += Number(payout.amount || 0)
      trendsMap.set(date, existing)
    }

    // Process revenue
    for (const item of lineItems || []) {
      const date = new Date(item.created_at).toISOString().split("T")[0]
      const existing = trendsMap.get(date) || { payoutAmount: 0, revenueAmount: 0, productCount: 0 }
      const price = typeof item.price === "string" ? parseFloat(item.price || "0") : item.price || 0
      // Convert to USD if needed (prices might be in different currencies)
      const priceUSD = await convertToUSD(price, "USD")
      existing.revenueAmount += priceUSD
      existing.productCount += 1
      trendsMap.set(date, existing)
    }

    // Convert to array and sort
    const trends = Array.from(trendsMap.entries())
      .map(([date, data]) => ({
        date,
        payoutAmount: data.payoutAmount,
        revenueAmount: data.revenueAmount,
        productCount: data.productCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate metrics
    const totalPayouts = payouts?.length || 0
    const totalPayoutAmount = payouts?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0
    const completedPayouts = payouts?.filter((p) => p.status === "completed").length || 0
    const averagePayoutAmount = totalPayouts > 0 ? totalPayoutAmount / totalPayouts : 0

    // Calculate payout velocity (payouts per week)
    const daysDiff = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    const weeksDiff = Math.max(daysDiff / 7, 1)
    const payoutVelocity = totalPayouts / weeksDiff

    // Calculate trend analysis
    const trendAnalysis = {
      daily: calculateTrend(trends, "daily"),
      weekly: calculateTrend(trends, "weekly"),
      monthly: calculateTrend(trends, "monthly"),
    }

    // Payment method breakdown
    const paymentMethodBreakdown = new Map<string, { count: number; amount: number }>()
    payouts?.forEach((payout) => {
      const method = payout.payment_method || "unknown"
      const existing = paymentMethodBreakdown.get(method) || { count: 0, amount: 0 }
      existing.count += 1
      existing.amount += Number(payout.amount || 0)
      paymentMethodBreakdown.set(method, existing)
    })

    return NextResponse.json({
      trends,
      metrics: {
        totalPayouts,
        totalPayoutAmount,
        completedPayouts,
        averagePayoutAmount,
        payoutVelocity,
        successRate: totalPayouts > 0 ? (completedPayouts / totalPayouts) * 100 : 0,
      },
      trendAnalysis,
      paymentMethodBreakdown: Array.from(paymentMethodBreakdown.entries()).map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount,
        percentage: totalPayoutAmount > 0 ? (data.amount / totalPayoutAmount) * 100 : 0,
      })),
    })
  } catch (error) {
    console.error("Error in analytics route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Calculate trend for different time periods
 */
function calculateTrend(
  trends: Array<{ date: string; payoutAmount: number; revenueAmount: number; productCount: number }>,
  period: "daily" | "weekly" | "monthly"
): {
  period: string
  payoutAmount: number
  revenueAmount: number
  productCount: number
  change: number
}[] {
  try {
    const grouped = new Map<string, { payoutAmount: number; revenueAmount: number; productCount: number }>()

    trends.forEach((trend) => {
      const date = new Date(trend.date)
      let key: string

      if (period === "daily") {
        key = trend.date
      } else if (period === "weekly") {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split("T")[0]
      } else {
        // monthly
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      }

      const existing = grouped.get(key) || { payoutAmount: 0, revenueAmount: 0, productCount: 0 }
      existing.payoutAmount += trend.payoutAmount
      existing.revenueAmount += trend.revenueAmount
      existing.productCount += trend.productCount
      grouped.set(key, existing)
    })

    const result = Array.from(grouped.entries())
      .map(([periodKey, data]) => ({
        period: periodKey,
        payoutAmount: data.payoutAmount,
        revenueAmount: data.revenueAmount,
        productCount: data.productCount,
        change: 0, // Will be calculated below
      }))
      .sort((a, b) => a.period.localeCompare(b.period))

    // Calculate change percentage
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1].payoutAmount
      const curr = result[i].payoutAmount
      result[i].change = prev > 0 ? ((curr - prev) / prev) * 100 : 0
    }

    return result
  } catch (error) {
    console.error("Error in calculateTrend:", error)
    return []
  }
}

