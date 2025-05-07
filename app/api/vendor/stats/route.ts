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

// Helper function to safely serialize data
function safeSerialize(obj: any) {
  // Create a safe copy with only the properties we need
  if (Array.isArray(obj)) {
    return obj.map((item) => safeSerialize(item))
  } else if (obj !== null && typeof obj === "object") {
    const result: Record<string, any> = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Skip functions and complex objects that might cause circular references
        if (typeof obj[key] !== "function") {
          result[key] = safeSerialize(obj[key])
        }
      }
    }
    return result
  }
  return obj
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

    // Create Supabase client
    const supabase = createClient()

    // Get date range for the selected period
    const dateRange = getDateRangeForPeriod(period, customStart, customEnd)
    const startDate = dateRange.start
    const endDate = dateRange.end

    // Get product count
    const { data: vendorProducts, error: productsError } = await supabase
      .from("products")
      .select("id")
      .eq("vendor", vendorName)

    if (productsError) {
      console.error("Error fetching vendor products:", productsError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Query line items directly by vendor_name and status="active"
    let query = supabase
      .from("order_line_items")
      .select("id, product_id, title, price, created_at, status")
      .eq("vendor_name", vendorName)
      .eq("status", "active")

    // Add date filtering if applicable
    if (startDate) {
      query = query.gte("created_at", startDate.toISOString())
    }

    if (endDate) {
      query = query.lte("created_at", endDate.toISOString())
    }

    // Execute query
    const { data: lineItems, error: lineItemsError } = await query

    if (lineItemsError) {
      console.error("Error fetching line items:", lineItemsError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Calculate total sales and revenue
    const totalSales = lineItems?.length || 0
    let totalRevenue = 0

    // Process line items - create a simplified array with only the data we need
    const salesData = []

    if (lineItems && lineItems.length > 0) {
      for (const item of lineItems) {
        // Add to revenue
        if (item.price !== null && item.price !== undefined) {
          const price = typeof item.price === "string" ? Number.parseFloat(item.price) : Number(item.price)
          if (!isNaN(price)) {
            totalRevenue += price
          }
        }

        // Add to sales data - only include necessary fields
        salesData.push({
          id: item.id,
          date: item.created_at,
          productId: item.product_id,
          productTitle: item.title || "Unknown Product",
          price: typeof item.price === "string" ? Number.parseFloat(item.price) : Number(item.price) || 0,
        })
      }
    }

    // Calculate pending payout (simplified)
    const pendingPayout = totalRevenue * 0.8 // Assuming 80% goes to vendor

    // Create a safe response object with only the data we need
    const responseData = {
      totalProducts: vendorProducts?.length || 0,
      totalSales: totalSales,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      pendingPayout: Number(pendingPayout.toFixed(2)),
      salesData: salesData,
      period: period,
      dateRange: startDate
        ? {
            start: startDate.toISOString(),
            end: endDate?.toISOString() || new Date().toISOString(),
          }
        : null,
    }

    // Return the safely serialized data
    return NextResponse.json(safeSerialize(responseData))
  } catch (error) {
    console.error("Unexpected error in vendor stats API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
