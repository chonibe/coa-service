import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { convertGBPToUSD } from "@/lib/utils"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const days = parseInt(searchParams.get("days") || "30")
  const vendorName = searchParams.get("vendorName")

  // Check if this is a vendor request
  if (vendorName) {
    const cookieStore = cookies()
    const sessionVendorName = getVendorFromCookieStore(cookieStore)
    if (sessionVendorName !== vendorName) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  } else {
    // Admin request
    const auth = guardAdminRequest(request)
    if (auth.kind !== "ok") {
      return auth.response
    }
  }

  try {
    const supabase = createClient()

    // Get historical payout data (last 90 days for better forecasting)
    const historicalDays = Math.max(days * 3, 90)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - historicalDays)

    let query = supabase
      .from("vendor_payouts")
      .select("amount, payout_date, created_at")
      .gte("created_at", startDate.toISOString())
      .in("status", ["completed", "paid"])
      .order("created_at", { ascending: true })

    if (vendorName) {
      query = query.eq("vendor_name", vendorName)
    }

    const { data: historicalPayouts, error } = await query

    if (error) {
      console.error("Error fetching historical payouts:", error)
      return NextResponse.json({ error: "Failed to fetch historical data" }, { status: 500 })
    }

    if (!historicalPayouts || historicalPayouts.length < 7) {
      return NextResponse.json({ forecast: [] })
    }

    // Group by date
    const dailyData = new Map<string, number>()
    historicalPayouts.forEach((payout) => {
      const date = new Date(payout.payout_date || payout.created_at).toISOString().split("T")[0]
      const existing = dailyData.get(date) || 0
      dailyData.set(date, existing + convertGBPToUSD(payout.amount || 0))
    })

    // Convert to sorted array
    const historicalArray = Array.from(dailyData.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Simple linear regression for forecasting
    const n = historicalArray.length
    const sumX = historicalArray.reduce((sum, _, i) => sum + i, 0)
    const sumY = historicalArray.reduce((sum, d) => sum + d.amount, 0)
    const sumXY = historicalArray.reduce((sum, d, i) => sum + i * d.amount, 0)
    const sumX2 = historicalArray.reduce((sum, _, i) => sum + i * i, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate standard deviation for confidence intervals
    const mean = sumY / n
    const variance =
      historicalArray.reduce((sum, d) => sum + Math.pow(d.amount - mean, 2), 0) / (n - 1)
    const stdDev = Math.sqrt(variance)

    // Generate forecast
    const forecast: Array<{
      date: string
      historical: number
      forecast: number
      confidenceLow: number
      confidenceHigh: number
      isHistorical: boolean
    }> = []

    // Add historical data
    historicalArray.forEach((d) => {
      forecast.push({
        date: d.date,
        historical: d.amount,
        forecast: 0,
        confidenceLow: 0,
        confidenceHigh: 0,
        isHistorical: true,
      })
    })

    // Generate future dates
    const lastDate = new Date(historicalArray[historicalArray.length - 1].date)
    for (let i = 1; i <= days; i++) {
      const futureDate = new Date(lastDate)
      futureDate.setDate(futureDate.getDate() + i)
      const dateStr = futureDate.toISOString().split("T")[0]

      const x = n + i - 1
      const predicted = slope * x + intercept
      const confidenceMargin = stdDev * 1.96 // 95% confidence interval

      forecast.push({
        date: dateStr,
        historical: 0,
        forecast: Math.max(0, predicted),
        confidenceLow: Math.max(0, predicted - confidenceMargin),
        confidenceHigh: predicted + confidenceMargin,
        isHistorical: false,
      })
    }

    return NextResponse.json({ forecast })
  } catch (error) {
    console.error("Error in forecast route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

