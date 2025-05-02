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
    const salesByMonth = {}
    let totalSales = 0
    let totalRevenue = 0

    // Format the line items for the frontend
    const formattedLineItems = lineItems.map((item) => {
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

      // Group by month for the chart
      const date = new Date(item.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!salesByMonth[monthKey]) {
        salesByMonth[monthKey] = { date: monthKey, sales: 0, revenue: 0 }
      }

      salesByMonth[monthKey].sales++
      salesByMonth[monthKey].revenue += price

      // Return formatted line item for the list
      return {
        id: item.product_id,
        title: item.product_title || "Unknown Product", // Use product_title instead of title
        price: price,
        currency: "USD", // Default to USD if currency is not available
        date: item.created_at,
        order_id: item.order_id,
        line_item_id: item.line_item_id,
        edition_number: item.edition_number,
      }
    })

    // Convert to array and sort by date
    const monthlySales = Object.values(salesByMonth).sort((a, b) => a.date.localeCompare(b.date))

    console.log(`Processed data: ${totalSales} total sales, $${totalRevenue.toFixed(2)} total revenue`)
    console.log(`Monthly data points: ${monthlySales.length}`)

    return NextResponse.json({
      totalSales,
      totalRevenue,
      salesByDate: monthlySales,
      lineItems: formattedLineItems,
    })
  } catch (error) {
    console.error("Unexpected error in vendor sales API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
