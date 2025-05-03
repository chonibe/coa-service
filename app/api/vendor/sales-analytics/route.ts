import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Get vendor ID from session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: vendorData } = await supabase.from("vendors").select("id").eq("auth_id", session.user.id).single()

    if (!vendorData) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const vendorId = vendorData.id

    // Get all products for this vendor
    const { data: products } = await supabase.from("products").select("id, title, vendor_id").eq("vendor_id", vendorId)

    if (!products || products.length === 0) {
      return NextResponse.json({
        salesByDate: [],
        salesByProduct: [],
        salesHistory: [],
        totalItems: 0,
      })
    }

    const productIds = products.map((product) => product.id)

    // Get sales data from line_items table
    const { data: salesData } = await supabase
      .from("line_items")
      .select("id, product_id, price, currency, created_at, quantity")
      .in("product_id", productIds)
      .order("created_at", { ascending: false })

    if (!salesData || salesData.length === 0) {
      return NextResponse.json({
        salesByDate: [],
        salesByProduct: [],
        salesHistory: [],
        totalItems: 0,
      })
    }

    // Create a map of product IDs to titles
    const productMap = products.reduce(
      (acc, product) => {
        acc[product.id] = product.title
        return acc
      },
      {} as Record<string, string>,
    )

    // Process sales by date (monthly)
    const salesByDateMap = salesData.reduce(
      (acc, item) => {
        const date = new Date(item.created_at)
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

        if (!acc[month]) {
          acc[month] = { month, sales: 0, revenue: 0 }
        }

        acc[month].sales += item.quantity || 1
        acc[month].revenue += Number.parseFloat(item.price) * (item.quantity || 1)

        return acc
      },
      {} as Record<string, { month: string; sales: number; revenue: number }>,
    )

    // Process sales by product
    const salesByProductMap = salesData.reduce(
      (acc, item) => {
        const productId = item.product_id

        if (!acc[productId]) {
          acc[productId] = {
            product_id: productId,
            title: productMap[productId] || `Product ${productId}`,
            sales: 0,
            revenue: 0,
          }
        }

        acc[productId].sales += item.quantity || 1
        acc[productId].revenue += Number.parseFloat(item.price) * (item.quantity || 1)

        return acc
      },
      {} as Record<string, { product_id: string; title: string; sales: number; revenue: number }>,
    )

    // Create sales history array
    const salesHistory = salesData.map((item) => ({
      id: item.id,
      product_id: item.product_id,
      title: productMap[item.product_id] || `Product ${item.product_id}`,
      date: item.created_at,
      price: Number.parseFloat(item.price),
      currency: item.currency || "USD",
      quantity: item.quantity || 1,
    }))

    return NextResponse.json({
      salesByDate: Object.values(salesByDateMap).sort((a, b) => a.month.localeCompare(b.month)),
      salesByProduct: Object.values(salesByProductMap),
      salesHistory,
      totalItems: salesData.length,
    })
  } catch (error) {
    console.error("Error in sales-analytics route:", error)
    return NextResponse.json({ error: "Failed to fetch sales analytics" }, { status: 500 })
  }
}
