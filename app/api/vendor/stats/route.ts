import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"

// Helper function to get date range based on period
function getDateRangeForPeriod(
  period: string,
  customStart?: string,
  customEnd?: string,
): { start: Date | null; end: Date | null } {
  // Handle custom date range
  if (period === "custom" && customStart && customEnd) {
    return {
      start: new Date(customStart),
      end: new Date(customEnd),
    }
  }

  const now = new Date()
  let end = new Date(now)
  let start: Date | null = null

  switch (period) {
    case "this-month":
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case "last-month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0) // Last day of previous month
      break
    case "last-3-months":
      start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      break
    case "last-6-months":
      start = new Date(now.getFullYear(), now.getMonth() - 6, 1)
      break
    case "this-year":
      start = new Date(now.getFullYear(), 0, 1)
      break
    case "last-year":
      start = new Date(now.getFullYear() - 1, 0, 1)
      end = new Date(now.getFullYear(), 0, 0) // Last day of previous year
      break
    case "all-time":
    default:
      // No date filtering for all-time
      return { start: null, end: null }
  }

  return { start, end }
}

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const url = new URL(request.url)
    const period = url.searchParams.get("period") || "all-time"
    const customStart = url.searchParams.get("start") || undefined
    const customEnd = url.searchParams.get("end") || undefined

    // Get vendor name from cookie
    const cookieStore = cookies()
    const vendorName = cookieStore.get("vendor_session")?.value

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log(`Fetching stats for vendor: ${vendorName}, period: ${period}`)
    if (period === "custom") {
      console.log(`Custom date range: ${customStart} to ${customEnd}`)
    }

    // Create Supabase client
    const supabase = createClient()

    // Get date range for the selected period
    const { start, end } = getDateRangeForPeriod(period, customStart, customEnd)

    // Build query for line items from this vendor
    let query = supabase.from("order_line_items").select("*").eq("vendor_name", vendorName).eq("status", "active")

    // Add date filtering if applicable
    if (start) {
      const startStr = start.toISOString()
      query = query.gte("created_at", startStr)
    }

    if (end) {
      const endStr = end.toISOString()
      query = query.lte("created_at", endStr)
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
    // In a real app, you'd calculate this based on unpaid line items
    const pendingPayout = totalRevenue * 0.8 // Assuming 80% goes to vendor

    // Return stats with period information
    return NextResponse.json({
      totalProducts: products?.length || 0,
      totalSales: totalSales,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      pendingPayout: Number(pendingPayout.toFixed(2)),
      period: period,
      dateRange: start
        ? {
            start: start.toISOString(),
            end: end?.toISOString() || new Date().toISOString(),
          }
        : null,
    })
  } catch (error) {
    console.error("Unexpected error in vendor stats API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
