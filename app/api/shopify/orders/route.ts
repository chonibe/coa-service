import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const status = searchParams.get("status") || "all"
    const search = searchParams.get("search") || ""
    const pageSize = 20

    // First, fetch the orders
    let query = supabase
      .from("order_line_items")
      .select("*")
      .order("updated_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    // Apply status filter
    if (status !== "all") {
      query = query.eq("status", status)
    }

    // Apply search filter
    if (search) {
      query = query.or(
        `order_name.ilike.%${search}%,order_id.ilike.%${search}%,product_id.ilike.%${search}%`
      )
    }

    const { data: orders, error: ordersError } = await query

    if (ordersError) {
      throw ordersError
    }

    // Get unique product IDs from orders
    const productIds = [...new Set(orders.map(order => order.product_id))]

    // Fetch product details for these IDs
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, vendor, certificate_url")
      .in("id", productIds)

    if (productsError) {
      throw productsError
    }

    // Create a map of product details
    const productMap = products.reduce((acc, product) => {
      acc[product.id] = product
      return acc
    }, {} as Record<string, any>)

    // Combine orders with their product details
    const ordersWithProducts = orders.map(order => ({
      ...order,
      product: productMap[order.product_id] || null
    }))

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from("order_line_items")
      .select("*", { count: "exact", head: true })

    return NextResponse.json({
      orders: ordersWithProducts,
      hasMore: totalCount ? page * pageSize < totalCount : false,
      total: totalCount,
    })
  } catch (error: any) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch orders" },
      { status: 500 }
    )
  }
} 