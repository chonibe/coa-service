import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30d"

    // Get vendor name from cookie
    const vendorName = cookieStore.get("vendor_name")?.value
    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get all line items for this vendor
    const { data: lineItems, error } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("vendor", vendorName)
      .eq("status", "active")

    if (error) {
      console.error("Error fetching line items:", error)
      return NextResponse.json({ error: "Failed to fetch sales data" }, { status: 500 })
    }

    if (!lineItems || lineItems.length === 0) {
      return NextResponse.json({
        totalSales: 0,
        totalRevenue: 0,
        salesByDate: [],
        salesByProduct: [],
        last30DaysTotal: { sales: 0, revenue: 0 }
      })
    }

    // Calculate date range based on period
    const now = new Date()
    let startDate = new Date()
    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      case "90d":
        startDate.setDate(now.getDate() - 90)
        break
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case "all":
        startDate = new Date(0) // Beginning of time
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Filter line items by date range
    const filteredItems = lineItems.filter(item => {
      const itemDate = new Date(item.created_at)
      return itemDate >= startDate && itemDate <= now
    })

    // Calculate totals for the selected period
    const totalSales = filteredItems.length
    const totalRevenue = filteredItems.reduce((sum, item) => {
      const price = parseFloat(item.price || "0")
      const quantity = item.quantity || 1
      return sum + (price * quantity)
    }, 0)

    // Calculate last 30 days totals for comparison
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(now.getDate() - 30)
    const last30DaysItems = lineItems.filter(item => {
      const itemDate = new Date(item.created_at)
      return itemDate >= thirtyDaysAgo && itemDate <= now
    })
    const last30DaysTotal = {
      sales: last30DaysItems.length,
      revenue: last30DaysItems.reduce((sum, item) => {
        const price = parseFloat(item.price || "0")
        const quantity = item.quantity || 1
        return sum + (price * quantity)
      }, 0)
    }

    // Process sales by date
    const salesByDate = processSalesByDate(filteredItems)
    const salesByProduct = processSalesByProduct(filteredItems)

    return NextResponse.json({
      totalSales,
      totalRevenue,
      salesByDate,
      salesByProduct,
      last30DaysTotal
    })
  } catch (error) {
    console.error("Error in sales analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function processSalesByDate(lineItems: any[]) {
  const salesByDate = new Map()

  lineItems.forEach((item) => {
    const date = new Date(item.created_at).toISOString().split("T")[0]
    const price = parseFloat(item.price || "0")
    const quantity = item.quantity || 1
    const revenue = price * quantity

    if (!salesByDate.has(date)) {
      salesByDate.set(date, { sales: 0, revenue: 0 })
    }

    const current = salesByDate.get(date)
    salesByDate.set(date, {
      sales: current.sales + 1,
      revenue: current.revenue + revenue,
    })
  })

  return Array.from(salesByDate.entries()).map(([date, data]) => ({
    date,
    ...data,
  }))
}

function processSalesByProduct(lineItems: any[]) {
  const salesByProduct = new Map()

  lineItems.forEach((item) => {
    const productId = item.product_id
    const price = parseFloat(item.price || "0")
    const quantity = item.quantity || 1
    const revenue = price * quantity

    if (!salesByProduct.has(productId)) {
      salesByProduct.set(productId, {
        productId,
        title: item.title || "Unknown Product",
        sales: 0,
        revenue: 0,
      })
    }

    const current = salesByProduct.get(productId)
    salesByProduct.set(productId, {
      ...current,
      sales: current.sales + 1,
      revenue: current.revenue + revenue,
    })
  })

  return Array.from(salesByProduct.values())
}
