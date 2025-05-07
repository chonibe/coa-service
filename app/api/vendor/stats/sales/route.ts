import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase"

interface LineItem {
  id: string
  line_item_id: string
  order_id: string
  order_name: string
  product_id: string
  variant_id: string
  edition_number: number
  created_at: string
  vendor_name: string
  status: string
  price: number
}

export async function GET(request: NextRequest) {
  try {
    // Get the vendor name from the cookie
    const cookieStore = await cookies()
    const vendorName = cookieStore.get("vendor_session")?.value

    if (!vendorName) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    if (!supabaseAdmin) {
      throw new Error("Supabase admin client not initialized")
    }

    console.log(`Fetching sales data for vendor: ${vendorName}`)

    // Query database for line items with active certificates for this vendor
    const { data: lineItems, error: lineItemsError } = await supabaseAdmin
      .from("order_line_items")
      .select(`
        id,
        line_item_id,
        order_id,
        order_name,
        product_id,
        variant_id,
        edition_number,
        created_at,
        vendor_name,
        status
      `)
      .eq("vendor_name", vendorName)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (lineItemsError) {
      console.error("Error fetching line items from Supabase:", lineItemsError)
      return NextResponse.json({ error: "Failed to fetch sales data" }, { status: 500 })
    }

    // Process the line items
    const salesData = (lineItems || []).map(item => ({
      ...item,
      price: 0, // Default price since we don't store it
      quantity: 1 // Default to 1 since quantity is not stored
    })) as LineItem[]

    // Group items by date (YYYY-MM-DD)
    const salesByDate: Record<string, { sales: number; revenue: number }> = {}
    let totalSales = 0
    let totalRevenue = 0

    salesData.forEach((item) => {
      // Format created_at date to YYYY-MM-DD
      const dateStr = new Date(item.created_at).toISOString().split("T")[0]

      // Initialize the date entry if it doesn't exist
      if (!salesByDate[dateStr]) {
        salesByDate[dateStr] = { sales: 0, revenue: 0 }
      }

      // Add the line item to the totals
      salesByDate[dateStr].sales += 1 // Each line item counts as 1 sale
      salesByDate[dateStr].revenue += item.price // Add the price to revenue

      // Update overall totals
      totalSales += 1
      totalRevenue += item.price
    })

    // Convert the salesByDate object to an array for the chart
    const chartSalesData = Object.entries(salesByDate).map(([date, stats]) => ({
      date,
      sales: stats.sales,
      revenue: stats.revenue,
    }))

    // Sort by date (oldest to newest)
    chartSalesData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Only return the last 30 days for the chart
    const last30Days = chartSalesData.slice(-30)

    return NextResponse.json({
      salesByDate: last30Days,
      totalSales,
      totalRevenue,
    })
  } catch (error: any) {
    console.error("Error in vendor sales stats API:", error)
    return NextResponse.json(
      {
        message: error.message || "An error occurred",
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
