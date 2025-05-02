import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorName = searchParams.get("vendor")
    const period = searchParams.get("period") || "month" // Default to month

    if (!vendorName) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })
    }

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date

    switch (period) {
      case "week":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        break
      case "year":
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1) // Default to month
    }

    const startDateStr = startDate.toISOString()
    const endDateStr = now.toISOString()

    // Get sales data for this vendor within the date range
    const { data: salesData, error: salesError } = await supabaseAdmin
      .from("order_line_items")
      .select("created_at")
      .eq("vendor_name", vendorName)
      .eq("status", "active")
      // Only count line items that are Unfulfilled or Fulfilled
      .in("fulfillment_status", ["Unfulfilled", "Fulfilled"])
      .is("deleted_at", null)
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr)
      .order("created_at", { ascending: true })

    if (salesError) {
      console.error("Error fetching vendor sales data:", salesError)
      return NextResponse.json({ error: "Failed to fetch vendor sales data" }, { status: 500 })
    }

    // Group sales by date
    const salesByDate: Record<string, number> = {}

    // Initialize all dates in the range with 0 sales
    const dateRange = getDateRange(startDate, now, period)
    dateRange.forEach((date) => {
      salesByDate[date] = 0
    })

    // Count sales for each date
    salesData?.forEach((item) => {
      const date = formatDate(new Date(item.created_at), period)
      salesByDate[date] = (salesByDate[date] || 0) + 1
    })

    // Convert to array format for chart
    const chartData = Object.entries(salesByDate).map(([date, count]) => ({
      date,
      sales: count,
    }))

    return NextResponse.json({ data: chartData })
  } catch (error) {
    console.error("Error in vendor sales stats API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

// Helper function to format date based on period
function formatDate(date: Date, period: string): string {
  switch (period) {
    case "week":
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    case "month":
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    case "year":
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    default:
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  }
}

// Helper function to get all dates in a range
function getDateRange(start: Date, end: Date, period: string): string[] {
  const dates: string[] = []
  const current = new Date(start)

  while (current <= end) {
    dates.push(formatDate(current, period))

    switch (period) {
      case "week":
      case "month":
        current.setDate(current.getDate() + 1)
        break
      case "year":
        current.setMonth(current.getMonth() + 1)
        break
      default:
        current.setDate(current.getDate() + 1)
    }
  }

  return dates
}
