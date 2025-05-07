import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const url = new URL(request.url)
    const period = url.searchParams.get("period") || "all-time"
    const customStart = url.searchParams.get("start") || undefined
    const customEnd = url.searchParams.get("end") || undefined
    const limit = Number.parseInt(url.searchParams.get("limit") || "100", 10)
    const offset = Number.parseInt(url.searchParams.get("offset") || "0", 10)

    // Get vendor name from cookie
    const cookieStore = cookies()
    const vendorName = cookieStore.get("vendor_session")?.value

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Create Supabase client
    const supabase = createClient()

    // First, get all products that belong to this vendor
    const { data: vendorProducts, error: productsError } = await supabase
      .from("products")
      .select("id, product_id, title")
      .eq("vendor", vendorName)

    if (productsError) {
      console.error("Error fetching vendor products:", productsError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!vendorProducts || vendorProducts.length === 0) {
      return NextResponse.json({ sales: [], total: 0 })
    }

    // Extract product IDs
    const productIds = vendorProducts.map((product) => product.product_id)

    // Create a map of product IDs to titles for later use
    const productTitles = new Map()
    vendorProducts.forEach((product) => {
      productTitles.set(product.product_id, product.title)
    })

    // Build query for line items for these products
    let query = supabase
      .from("order_line_items")
      .select("*", { count: "exact" })
      .in("product_id", productIds)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    // Add date filtering if applicable
    if (customStart && period === "custom") {
      query = query.gte("created_at", new Date(customStart).toISOString())
    }

    if (customEnd && period === "custom") {
      query = query.lte("created_at", new Date(customEnd).toISOString())
    } else if (period !== "all-time" && period !== "custom") {
      // Apply predefined period filters
      const now = new Date()
      let startDate = null

      switch (period) {
        case "this-month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case "last-month":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const endDate = new Date(now.getFullYear(), now.getMonth(), 0)
          query = query.lte("created_at", endDate.toISOString())
          break
        case "last-3-months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
          break
        case "last-6-months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
          break
        case "this-year":
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        case "last-year":
          startDate = new Date(now.getFullYear() - 1, 0, 1)
          const lastYearEnd = new Date(now.getFullYear(), 0, 0)
          query = query.lte("created_at", lastYearEnd.toISOString())
          break
      }

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString())
      }
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: lineItems, error, count } = await query

    if (error) {
      console.error("Database error when fetching line items:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Format the sales data
    const sales =
      lineItems?.map((item) => ({
        id: item.id,
        orderId: item.order_id,
        orderName: item.order_name,
        lineItemId: item.line_item_id,
        productId: item.product_id,
        productTitle: productTitles.get(item.product_id) || "Unknown Product",
        price: item.price,
        editionNumber: item.edition_number,
        editionTotal: item.edition_total,
        createdAt: item.created_at,
        status: item.status,
      })) || []

    return NextResponse.json({
      sales,
      total: count || 0,
      period,
      dateRange: customStart && customEnd && period === "custom" ? { start: customStart, end: customEnd } : null,
    })
  } catch (error) {
    console.error("Unexpected error in vendor sales data API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
