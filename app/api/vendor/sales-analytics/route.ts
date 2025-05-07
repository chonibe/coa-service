import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"

// Helper function to get date range based on period (same as in stats route)
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

// Helper function to group data by time period
function groupDataByPeriod(data: any[], period: string) {
  if (!data || data.length === 0) return []

  // Sort data by created_at
  const sortedData = [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const groupedData: Record<string, number> = {}

  sortedData.forEach((item) => {
    const date = new Date(item.created_at)
    let key = ""

    // Group by different time periods based on the selected period
    switch (period) {
      case "this-month":
      case "last-month":
        // Group by day
        key = `Day ${date.getDate()}`
        break

      case "this-year":
      case "last-year":
        // Group by month
        key = date.toLocaleString("default", { month: "short" })
        break

      case "last-3-months":
      case "last-6-months":
        // Group by week
        const weekNumber = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)
        key = `Week ${weekNumber}, ${date.toLocaleString("default", { month: "short" })}`
        break

      case "all-time":
      default:
        // Group by year
        key = date.getFullYear().toString()
        break
    }

    // Calculate price
    const price = typeof item.price === "string" ? Number.parseFloat(item.price) : Number(item.price)

    if (!isNaN(price)) {
      if (groupedData[key]) {
        groupedData[key] += price
      } else {
        groupedData[key] = price
      }
    }
  })

  // Convert to array format for chart
  return Object.entries(groupedData).map(([name, total]) => ({
    name,
    total: Number(total.toFixed(2)),
  }))
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

    // Create Supabase client
    const supabase = createClient()

    // Get date range based on period
    const { startDate, endDate } = getDateRange(period)

    // Build query for line items from this vendor
    let query = supabase.from("order_line_items").select("*").eq("vendor_name", vendorName).eq("status", "active")

    // Add date filtering if a specific period is selected
    if (startDate && endDate) {
      query = query.gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString())
    }

    // Execute query
    const { data: lineItems, error } = await query

    if (error) {
      console.error("Database error when fetching line items:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Group data by time period
    const chartData = groupDataByPeriod(lineItems || [], period)

    // Return the data
    return NextResponse.json({
      data: chartData,
      period: period,
      dateRange:
        startDate && endDate
          ? {
              start: startDate.toISOString(),
              end: endDate.toISOString(),
            }
          : null,
    })
  } catch (error) {
    console.error("Unexpected error in sales analytics API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
