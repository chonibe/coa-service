import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"

// Helper function to get date range based on period
function getDateRange(period: string) {
  const now = new Date()
  const startDate = new Date()

  switch (period) {
    case "this-month":
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
      return { startDate, endDate: now }

    case "last-month":
      startDate.setMonth(startDate.getMonth() - 1)
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)
      endDate.setDate(0)
      endDate.setHours(23, 59, 59, 999)
      return { startDate, endDate }

    case "this-year":
      startDate.setMonth(0, 1)
      startDate.setHours(0, 0, 0, 0)
      return { startDate, endDate: now }

    case "last-year":
      startDate.setFullYear(startDate.getFullYear() - 1)
      startDate.setMonth(0, 1)
      startDate.setHours(0, 0, 0, 0)
      const lastYearEnd = new Date(startDate)
      lastYearEnd.setFullYear(lastYearEnd.getFullYear() + 1)
      lastYearEnd.setDate(0)
      lastYearEnd.setHours(23, 59, 59, 999)
      return { startDate, endDate: lastYearEnd }

    case "last-3-months":
      startDate.setMonth(startDate.getMonth() - 3)
      return { startDate, endDate: now }

    case "last-6-months":
      startDate.setMonth(startDate.getMonth() - 6)
      return { startDate, endDate: now }

    case "all-time":
    default:
      return { startDate: null, endDate: null }
  }
}

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const url = new URL(request.url)
    const period = url.searchParams.get("period") || "all-time"

    // Get vendor name from cookie
    const cookieStore = cookies()
    const vendorName = cookieStore.get("vendor_session")?.value

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log(`Fetching stats for vendor: ${vendorName}, period: ${period}`)

    // Create Supabase client
    const supabase = createClient()

    // Get date range based on period
    const { startDate, endDate } = getDateRange(period)

    // Build query for line items from this vendor
    let query = supabase.from("order_line_items").select("*").eq("vendor_name", vendorName).eq("status", "active")

    // Add date filtering if a specific period is selected
    if (startDate && endDate) {
      // Assuming there's a created_at or order_date column
      query = query.gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString())
    }

    // Execute query
    const { data: lineItems, error } = await query

    if (error) {
      console.error("Database error when fetching line items:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Calculate total sales and revenue
    let totalSales = 0
    let totalRevenue = 0

    lineItems?.forEach((item) => {
      totalSales += 1

      // Add to revenue - handle different price formats
      if (item.price !== null && item.price !== undefined) {
        const price = typeof item.price === "string" ? Number.parseFloat(item.price) : Number(item.price)
        if (!isNaN(price)) {
          totalRevenue += price
        }
      }
    })

    // Query for products from this vendor
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("vendor", vendorName)

    if (productsError) {
      console.error("Database error when fetching products:", productsError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Calculate pending payout (simplified version)
    const pendingPayout = totalRevenue * 0.8 // Assuming 80% goes to vendor

    // Get period label for display
    const periodLabels: Record<string, string> = {
      "all-time": "All Time",
      "this-month": "This Month",
      "last-month": "Last Month",
      "this-year": "This Year",
      "last-year": "Last Year",
      "last-3-months": "Last 3 Months",
      "last-6-months": "Last 6 Months",
    }

    // Return stats
    return NextResponse.json({
      totalProducts: products?.length || 0,
      totalSales: totalSales,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      pendingPayout: Number(pendingPayout.toFixed(2)),
      period: period,
      periodLabel: periodLabels[period] || "Custom Period",
      dateRange:
        startDate && endDate
          ? {
              start: startDate.toISOString(),
              end: endDate.toISOString(),
            }
          : null,
    })
  } catch (error) {
    console.error("Unexpected error in vendor stats API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
