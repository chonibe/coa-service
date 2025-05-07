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
  let endDate = new Date(now)
  let startDate: Date | null = null

  switch (period) {
    case "this-month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case "last-month":
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0) // Last day of previous month
      break
    case "last-3-months":
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      break
    case "last-6-months":
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
      break
    case "this-year":
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    case "last-year":
      startDate = new Date(now.getFullYear() - 1, 0, 1)
      endDate = new Date(now.getFullYear(), 0, 0) // Last day of previous year
      break
    case "all-time":
    default:
      // No date filtering for all-time
      return { start: null, end: null }
  }

  return { start: startDate, end: endDate }
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
    const dateRange = getDateRangeForPeriod(period, customStart, customEnd)
    const startDate = dateRange.start
    const endDate = dateRange.end

    // First, get all products that belong to this vendor
    const { data: vendorProducts, error: productsError } = await supabase
      .from("products")
      .select("id, product_id, title, price")
      .eq("vendor", vendorName)

    if (productsError) {
      console.error("Error fetching vendor products:", productsError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!vendorProducts || vendorProducts.length === 0) {
      console.log(`No products found for vendor: ${vendorName}`)
      return NextResponse.json({
        totalProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
        pendingPayout: 0,
        period: period,
        dateRange: startDate
          ? {
              start: startDate.toISOString(),
              end: endDate?.toISOString() || new Date().toISOString(),
            }
          : null,
      })
    }

    // Extract product IDs
    const productIds = vendorProducts.map((product) => product.product_id)
    console.log(`Found ${productIds.length} products for vendor: ${vendorName}`)

    // Build query for line items for these products
    let query = supabase.from("order_line_items").select("*").in("product_id", productIds).eq("status", "active")

    // Add date filtering if applicable
    if (startDate) {
      const startStr = startDate.toISOString()
      query = query.gte("created_at", startStr)
    }

    if (endDate) {
      const endStr = endDate.toISOString()
      query = query.lte("created_at", endStr)
    }

    // Execute query
    const { data: lineItems, error } = await query

    if (error) {
      console.error("Database error when fetching line items:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    console.log(`Found ${lineItems?.length || 0} line items for vendor products`)

    // Calculate total sales and revenue
    const totalSales = lineItems?.length || 0
    let totalRevenue = 0

    // Create a map to track sales by date for charting
    const salesByDate = new Map()

    if (lineItems) {
      for (const item of lineItems) {
        // Add to revenue - handle different price formats
        if (item.price !== null && item.price !== undefined) {
          const price = typeof item.price === "string" ? Number.parseFloat(item.price) : Number(item.price)
          if (!isNaN(price)) {
            totalRevenue += price
          }
        }

        // Track sales by date (using date part only)
        const saleDate = item.created_at ? item.created_at.split("T")[0] : null
        if (saleDate) {
          if (salesByDate.has(saleDate)) {
            salesByDate.set(saleDate, salesByDate.get(saleDate) + 1)
          } else {
            salesByDate.set(saleDate, 1)
          }
        }
      }
    }

    // Convert salesByDate map to array for the response
    const salesTimeline = Array.from(salesByDate.entries())
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate pending payout (simplified version)
    // In a real app, you'd calculate this based on unpaid line items
    const pendingPayout = totalRevenue * 0.8 // Assuming 80% goes to vendor

    // Return stats with period information
    return NextResponse.json({
      totalProducts: vendorProducts.length,
      totalSales: totalSales,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      pendingPayout: Number(pendingPayout.toFixed(2)),
      salesTimeline: salesTimeline,
      period: period,
      dateRange: startDate
        ? {
            start: startDate.toISOString(),
            end: endDate?.toISOString() || new Date().toISOString(),
          }
        : null,
    })
  } catch (error) {
    console.error("Unexpected error in vendor stats API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
