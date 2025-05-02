import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    // Get vendor name from cookie
    const cookieStore = cookies()
    const vendorName = cookieStore.get("vendor_session")?.value

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Parse query parameters
    const url = new URL(request.url)
    const days = Number.parseInt(url.searchParams.get("days") || "30", 10)

    // Create Supabase client
    const supabase = createClient()

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Format dates for SQL query
    const startDateStr = startDate.toISOString().split("T")[0]
    const endDateStr = endDate.toISOString().split("T")[0]

    // Get sales data for this vendor
    const { data: salesData, error: salesError } = await supabase
      .from("product_vendor_payouts")
      .select(`
        product_id,
        product_title,
        vendor_name,
        line_items:line_item_id(
          id,
          order_id,
          price,
          quantity,
          created_at
        )
      `)
      .eq("vendor_name", vendorName)
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr)

    if (salesError) {
      console.error("Error fetching sales data:", salesError)
      return NextResponse.json({ error: "Failed to fetch sales data" }, { status: 500 })
    }

    // Calculate previous period for comparison
    const previousStartDate = new Date(startDate)
    previousStartDate.setDate(previousStartDate.getDate() - days)
    const previousEndDate = new Date(startDate)
    previousEndDate.setDate(previousEndDate.getDate() - 1)

    // Format dates for previous period
    const prevStartDateStr = previousStartDate.toISOString().split("T")[0]
    const prevEndDateStr = previousEndDate.toISOString().split("T")[0]

    // Get previous period sales data
    const { data: prevSalesData, error: prevSalesError } = await supabase
      .from("product_vendor_payouts")
      .select(`
        line_items:line_item_id(
          id,
          price,
          quantity,
          created_at
        )
      `)
      .eq("vendor_name", vendorName)
      .gte("created_at", prevStartDateStr)
      .lte("created_at", prevEndDateStr)

    if (prevSalesError) {
      console.error("Error fetching previous sales data:", prevSalesError)
      // Continue anyway, we'll just not have comparison data
    }

    // Process the data
    const processedData = processShopifyData(salesData, prevSalesData, days)

    return NextResponse.json(processedData)
  } catch (error: any) {
    console.error("Error in Shopify Analytics API:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}

// Helper function to process the raw data into a more usable format
function processShopifyData(salesData: any[], prevSalesData: any[] | null, days: number) {
  // Initialize result object
  const result: any = {
    overview: {
      totalRevenue: 0,
      totalOrders: 0,
      conversionRate: 0,
      revenueChange: 0,
      ordersChange: 0,
      conversionChange: 0,
    },
    salesOverTime: [],
    topProducts: [],
  }

  // Process current period data
  const orderIds = new Set()
  const productMap: Record<string, { id: string; title: string; revenue: number; unitsSold: number }> = {}
  const dailySales: Record<string, { date: string; revenue: number; orders: number }> = {}

  // Generate all dates in the range
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    dailySales[dateStr] = { date: dateStr, revenue: 0, orders: 0 }
  }

  // Process sales data
  salesData.forEach((item) => {
    if (!item.line_items) return

    const lineItems = Array.isArray(item.line_items) ? item.line_items : [item.line_items]

    lineItems.forEach((lineItem: any) => {
      if (!lineItem) return

      // Add to total revenue
      const revenue = Number.parseFloat(lineItem.price) * lineItem.quantity
      result.overview.totalRevenue += revenue

      // Track unique orders
      orderIds.add(lineItem.order_id)

      // Add to product map
      if (!productMap[item.product_id]) {
        productMap[item.product_id] = {
          id: item.product_id,
          title: item.product_title || `Product ${item.product_id}`,
          revenue: 0,
          unitsSold: 0,
        }
      }
      productMap[item.product_id].revenue += revenue
      productMap[item.product_id].unitsSold += lineItem.quantity

      // Add to daily sales
      const date = new Date(lineItem.created_at).toISOString().split("T")[0]
      if (dailySales[date]) {
        dailySales[date].revenue += revenue
        dailySales[date].orders += 1
      }
    })
  })

  // Set total orders
  result.overview.totalOrders = orderIds.size

  // Calculate conversion rate (placeholder - would need actual visit data)
  result.overview.conversionRate = orderIds.size > 0 ? 2.5 : 0 // Placeholder value

  // Process previous period data for comparison
  if (prevSalesData) {
    const prevOrderIds = new Set()
    let prevRevenue = 0

    prevSalesData.forEach((item) => {
      if (!item.line_items) return

      const lineItems = Array.isArray(item.line_items) ? item.line_items : [item.line_items]

      lineItems.forEach((lineItem: any) => {
        if (!lineItem) return

        prevRevenue += Number.parseFloat(lineItem.price) * lineItem.quantity
        prevOrderIds.add(lineItem.order_id)
      })
    })

    // Calculate changes
    const prevOrders = prevOrderIds.size
    result.overview.revenueChange =
      prevRevenue > 0 ? ((result.overview.totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

    result.overview.ordersChange = prevOrders > 0 ? ((result.overview.totalOrders - prevOrders) / prevOrders) * 100 : 0

    result.overview.conversionChange = 0.5 // Placeholder value
  }

  // Sort and limit top products
  result.topProducts = Object.values(productMap)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 10)

  // Format sales over time
  result.salesOverTime = Object.values(dailySales).sort((a: any, b: any) => a.date.localeCompare(b.date))

  return result
}
