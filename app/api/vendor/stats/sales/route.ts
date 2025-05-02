import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    // Get vendor name from cookie
    const cookieStore = cookies()
    const vendorName = cookieStore.get("vendor_session")?.value

    if (!vendorName) {
      console.log("Vendor not authenticated")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log(`Fetching sales data for vendor: ${vendorName}`)

    // Get all active line items for this vendor with the correct column names
    const { data: lineItems, error } = await supabaseAdmin
      .from("order_line_items")
      .select(`
        id,
        product_id,
        product_title,
        price,
        order_id,
        line_item_id,
        edition_number,
        created_at,
        status,
        vendor_name
      `)
      .eq("vendor_name", vendorName)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Found ${lineItems.length} line items for vendor ${vendorName}`)

    // Process the data
    const salesByDate = {}
    let totalSales = 0
    let totalRevenue = 0

    lineItems.forEach((item) => {
      // Skip items without edition numbers in the count (not certified)
      if (item.edition_number) {
        totalSales++
      }

      // Handle price - convert to number if needed
      let price = 0
      if (item.price) {
        price = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price
      }
      totalRevenue += price

      // Group by date for the chart (YYYY-MM-DD)
      const date = new Date(item.created_at)
      const dateKey = date.toISOString().split("T")[0]

      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = { date: dateKey, sales: 0, revenue: 0 }
      }

      salesByDate[dateKey].sales++
      salesByDate[dateKey].revenue += price
    })

    // Convert to array and sort by date
    const dailySales = Object.values(salesByDate).sort((a, b) => a.date.localeCompare(b.date))

    // Only return the last 30 days for the chart
    const last30Days = dailySales.slice(-30)

    console.log(`Processed data: ${totalSales} total sales, $${totalRevenue.toFixed(2)} total revenue`)
    console.log(`Daily data points: ${dailySales.length}, showing last ${last30Days.length}`)

    return NextResponse.json({
      totalSales,
      totalRevenue,
      salesByDate: last30Days,
    })
  } catch (error) {
    console.error("Unexpected error in vendor sales API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
