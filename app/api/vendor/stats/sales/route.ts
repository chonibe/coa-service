import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Get the vendor name from the cookie
    const cookieStore = cookies()
    const vendorName = cookieStore.get("vendor_session")?.value

    if (!vendorName) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    // Query database for line items with active certificates for this vendor
    const { data: lineItems, error: lineItemsError } = await supabaseAdmin
      .from("order_line_items")
      .select(`
        id,
        line_item_id,
        order_id,
        order_name,
        product_id,
        product_title,
        variant_id,
        price,
        quantity,
        edition_number,
        created_at,
        vendor_name,
        status
      `)
      .eq("vendor_name", vendorName)
      .eq("status", "active")
      .not("edition_number", "is", null)
      .order("created_at", { ascending: false })

    if (lineItemsError) {
      console.error("Error fetching line items:", lineItemsError)
      return NextResponse.json(
        {
          message: "Failed to fetch line items",
          error: lineItemsError,
        },
        { status: 500 },
      )
    }

    // Group items by date (YYYY-MM-DD)
    const salesByDate: Record<string, { sales: number; revenue: number }> = {}
    let totalSales = 0
    let totalRevenue = 0

    lineItems.forEach((item) => {
      // Format created_at date to YYYY-MM-DD
      const dateStr = new Date(item.created_at).toISOString().split("T")[0]

      // Convert price to number if it's a string
      const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0

      // Initialize the date entry if it doesn't exist
      if (!salesByDate[dateStr]) {
        salesByDate[dateStr] = { sales: 0, revenue: 0 }
      }

      // Add the line item to the totals
      salesByDate[dateStr].sales += 1
      salesByDate[dateStr].revenue += price

      // Update overall totals
      totalSales += 1
      totalRevenue += price
    })

    // Convert the salesByDate object to an array for the chart
    const salesData = Object.entries(salesByDate).map(([date, stats]) => ({
      date,
      sales: stats.sales,
      revenue: stats.revenue,
    }))

    // Sort by date (oldest to newest)
    salesData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Only return the last 30 days for the chart
    const last30Days = salesData.slice(-30)

    // Format the line items for the sales history list
    const salesItems = lineItems.map((item) => ({
      id: item.id,
      line_item_id: item.line_item_id,
      order_name: item.order_name,
      product_title: item.product_title || "Unknown Product",
      price: typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0,
      created_at: item.created_at,
    }))

    return NextResponse.json({
      salesByDate: last30Days,
      totalSales,
      totalRevenue,
      salesItems,
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
