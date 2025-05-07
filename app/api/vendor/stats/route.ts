import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    // Get vendor name from cookie
    const cookieStore = cookies()
    const vendorName = cookieStore.get("vendor_session")?.value

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log(`Fetching stats for vendor: ${vendorName}`)

    // Create Supabase client
    const supabase = createClient()

    // Query for line items from this vendor - REMOVED date filtering to get all-time data
    const { data: lineItems, error } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("vendor_name", vendorName)
      .eq("status", "active")

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

    // Return stats
    return NextResponse.json({
      totalProducts: products?.length || 0,
      totalSales: totalSales,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      pendingPayout: Number(pendingPayout.toFixed(2)),
      // Add a note to clarify these are all-time stats
      timeframe: "all-time",
    })
  } catch (error) {
    console.error("Unexpected error in vendor stats API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
