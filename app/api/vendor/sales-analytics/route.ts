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

    // Check if order_line_items table exists
    try {
      const { data: tableCheck, error: tableError } = await supabase.from("order_line_items").select("id").limit(1)

      if (tableError) {
        console.log("Using fallback mock data due to table error:", tableError.message)
        return NextResponse.json(getMockAnalyticsData())
      }
    } catch (err) {
      console.log("Using fallback mock data due to error:", err)
      return NextResponse.json(getMockAnalyticsData())
    }

    // Query for line items from this vendor
    const { data: lineItems, error } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("vendor_name", vendorName)
      .eq("status", "active")

    if (error) {
      console.error("Database error when fetching line items:", error)
      return NextResponse.json(getMockAnalyticsData())
    }

    // If no data found, return mock data
    if (!lineItems || lineItems.length === 0) {
      console.log("No line items found, using mock data")
      return NextResponse.json(getMockAnalyticsData())
    }

    // Process line items to get sales by date
    const salesByDate = processSalesByDate(lineItems)

    // Get sales by product
    const salesByProduct = processSalesByProduct(lineItems)

    // Create sales history array
    const salesHistory = lineItems.map((item) => ({
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
      totalItems: lineItems.length,
    })
  } catch (error: any) {
    console.error("Unexpected error in vendor sales analytics API:", error)
    return NextResponse.json(getMockAnalyticsData())
  }
}

function processSalesByDate(lineItems: any[]) {
  // Group sales by month
  const salesByMonth: Record<string, { sales: number; revenue: number }> = {}

  lineItems.forEach((item) => {
    const date = new Date(item.created_at || item.updated_at || Date.now())
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

    if (!salesByMonth[monthYear]) {
      salesByMonth[monthYear] = { sales: 0, revenue: 0 }
    }

    salesByMonth[monthYear].sales += 1

    // Add to revenue
    if (item.price) {
      const price = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price
      salesByMonth[monthYear].revenue += price
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

function processSalesByProduct(lineItems: any[]) {
  // Group sales by product
  const salesByProduct: Record<string, { productId: string; title: string; sales: number; revenue: number }> = {}

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

    // Add to revenue
    if (item.price) {
      const price = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price
      salesByProduct[productId].revenue += price
    }
  })

  // Convert to array and sort by sales
  return Object.values(salesByProduct).sort((a, b) => b.sales - a.sales)
}

function getMonthName(dateStr: string) {
  const [year, month] = dateStr.split("-")
  const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
  return date.toLocaleString("default", { month: "short", year: "numeric" })
}

// Fallback mock data
function getMockAnalyticsData() {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  // Generate last 6 months of data
  const salesByDate = Array.from({ length: 6 })
    .map((_, i) => {
      const month = (currentMonth - i + 12) % 12
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear
      const date = `${year}-${String(month + 1).padStart(2, "0")}`

      return {
        date,
        month: new Date(year, month, 1).toLocaleString("default", { month: "short", year: "numeric" }),
        sales: Math.floor(Math.random() * 10) + 1,
        revenue: Number((Math.random() * 500 + 100).toFixed(2)),
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  // Generate product data
  const productNames = ["Limited Edition Print", "Canvas Art", "Framed Photograph", "Art Book", "Digital Download"]

  const salesByProduct = productNames
    .map((title, i) => ({
      productId: `product-${i + 1}`,
      title,
      sales: Math.floor(Math.random() * 15) + 1,
      revenue: Number((Math.random() * 800 + 200).toFixed(2)),
    }))
    .sort((a, b) => b.sales - a.sales)

  // Generate sales history
  const salesHistory = Array.from({ length: 20 })
    .map((_, i) => {
      const daysAgo = Math.floor(Math.random() * 180)
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)

      const productIndex = Math.floor(Math.random() * productNames.length)

      return {
        id: `mock-item-${i + 1}`,
        product_id: `product-${productIndex + 1}`,
        title: productNames[productIndex],
        date: date.toISOString(),
        price: Number((Math.random() * 150 + 50).toFixed(2)),
        currency: "GBP",
        quantity: 1,
      }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return {
    salesByDate,
    salesByProduct,
    salesHistory,
    totalItems: salesHistory.length,
    isMockData: true,
  }
}
