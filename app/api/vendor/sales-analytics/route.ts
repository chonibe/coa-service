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

    console.log(`Fetching sales analytics for vendor: ${vendorName}`)

    // Create Supabase client
    const supabase = createClient()

    // Query for line items from this vendor
    const { data: lineItems, error } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("vendor_name", vendorName)
      .eq("status", "active")

    if (error) {
      console.error("Database error when fetching line items:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Fetch payout settings for these products
    const productIds = lineItems?.map(item => item.product_id) || []
    const { data: payouts, error: payoutsError } = await supabase
      .from("product_vendor_payouts")
      .select("product_id, payout_amount, is_percentage")
      .eq("vendor_name", vendorName)
      .in("product_id", productIds)

    if (payoutsError) {
      console.error("Error fetching vendor payouts:", payoutsError)
    }

    console.log(`Found ${lineItems?.length || 0} active line items for vendor ${vendorName}`)
    if (lineItems && lineItems.length > 0) {
      console.log("Sample line item:", JSON.stringify(lineItems[0], null, 2))
    }

    // Process line items to get sales by date
    const salesByDate = processSalesByDate(lineItems || [], payouts || [])

    // Get sales by product
    const salesByProduct = processSalesByProduct(lineItems || [], payouts || [])

    // Create sales history array
    const salesHistory = (lineItems || []).map((item) => {
      const payout = payouts?.find(p => p.product_id === item.product_id)
      const price = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price || 0
      const payoutAmount = payout?.is_percentage 
        ? (price * (payout.payout_amount / 100))
        : payout?.payout_amount || 0

      return {
        id: item.id || `item-${Math.random().toString(36).substring(2, 9)}`,
        product_id: item.product_id || "",
        title: item.title || "Unknown Product",
        date: item.created_at || new Date().toISOString(),
        price: payoutAmount,
        currency: "GBP", // Default to GBP for all products
        quantity: item.quantity || 1,
      }
    })

    return NextResponse.json({
      salesByDate,
      salesByProduct,
      salesHistory,
      totalItems: lineItems?.length || 0,
    })
  } catch (error) {
    console.error("Unexpected error in vendor sales analytics API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

function processSalesByDate(lineItems, payouts) {
  // Group sales by date
  const salesByDate = {}

  lineItems.forEach((item) => {
    // Ensure we have a valid date
    let date
    try {
      date = new Date(item.created_at || item.updated_at || Date.now())
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date for item ${item.id}:`, item.created_at)
        return
      }
    } catch (e) {
      console.warn(`Error parsing date for item ${item.id}:`, e)
      return
    }

    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format

    if (!salesByDate[dateStr]) {
      salesByDate[dateStr] = { sales: 0, revenue: 0 }
    }

    salesByDate[dateStr].sales += 1

    // Calculate revenue based on payout settings
    const payout = payouts.find(p => p.product_id === item.product_id)
    const price = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price || 0
    const payoutAmount = payout?.is_percentage 
      ? (price * (payout.payout_amount / 100))
      : payout?.payout_amount || 0

    salesByDate[dateStr].revenue += payoutAmount
  })

  // Convert to array and sort by date
  return Object.entries(salesByDate)
    .map(([date, data]) => ({
      date,
      month: getMonthName(date),
      sales: data.sales,
      revenue: Number(data.revenue.toFixed(2)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function processSalesByProduct(lineItems, payouts) {
  // Group sales by product
  const salesByProduct = {}

  lineItems.forEach((item) => {
    const productId = item.product_id || "unknown"
    const title = item.title || `Product ${productId}`

    if (!salesByProduct[productId]) {
      salesByProduct[productId] = {
        productId,
        title,
        sales: 0,
        revenue: 0,
      }
    }

    salesByProduct[productId].sales += 1

    // Calculate revenue based on payout settings
    const payout = payouts.find(p => p.product_id === item.product_id)
    const price = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price || 0
    const payoutAmount = payout?.is_percentage 
      ? (price * (payout.payout_amount / 100))
      : payout?.payout_amount || 0

    salesByProduct[productId].revenue += payoutAmount
  })

  // Convert to array and sort by sales
  return Object.values(salesByProduct).sort((a, b) => b.sales - a.sales)
}

function getMonthName(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleString("default", { month: "short", year: "numeric" })
}
