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

    console.log(`Found ${lineItems?.length || 0} active line items for vendor ${vendorName}`)
    if (lineItems && lineItems.length > 0) {
      console.log("Sample line item:", JSON.stringify(lineItems[0], null, 2))
    }

    // Process line items to get sales by date - fixed to prevent recursion
    const salesByDate = processSalesByDate(lineItems || [])

    // Get sales by product - fixed to prevent recursion
    const salesByProduct = processSalesByProduct(lineItems || [])

    // Create sales history array
    const salesHistory = (lineItems || []).map((item) => ({
      id: item.id || `item-${Math.random().toString(36).substring(2, 9)}`,
      product_id: item.product_id || "",
      title: item.title || "Unknown Product",
      date: item.created_at || new Date().toISOString(),
      price: typeof item.price === "string" ? Number.parseFloat(item.price) : item.price || 0,
      currency: "GBP", // Default to GBP for all products
      quantity: item.quantity || 1,
    }))

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

// Fixed function to prevent recursion
function processSalesByDate(lineItems) {
  // Group sales by month
  const salesByMonth = {}

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

    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

    if (!salesByMonth[monthYear]) {
      salesByMonth[monthYear] = { sales: 0, revenue: 0 }
    }

    salesByMonth[monthYear].sales += 1

    // Add to revenue - fixed to prevent NaN and type issues
    if (item.price !== null && item.price !== undefined) {
      const price = typeof item.price === "string" ? Number.parseFloat(item.price) : Number(item.price)
      if (!isNaN(price)) {
        salesByMonth[monthYear].revenue += price
      }
    }
  })

  // Convert to array and sort by date
  return Object.entries(salesByMonth)
    .map(([date, data]) => ({
      date,
      month: getMonthName(date),
      sales: data.sales,
      revenue: Number(data.revenue.toFixed(2)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// Fixed function to prevent recursion
function processSalesByProduct(lineItems) {
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

    // Add to revenue - fixed to prevent NaN and type issues
    if (item.price !== null && item.price !== undefined) {
      const price = typeof item.price === "string" ? Number.parseFloat(item.price) : Number(item.price)
      if (!isNaN(price)) {
        salesByProduct[productId].revenue += price
      }
    }
  })

  // Convert to array and sort by sales
  return Object.values(salesByProduct).sort((a, b) => b.sales - a.sales)
}

function getMonthName(dateStr) {
  const [year, month] = dateStr.split("-")
  const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
  return date.toLocaleString("default", { month: "short", year: "numeric" })
}
