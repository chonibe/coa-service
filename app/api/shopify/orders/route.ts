import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ShopifyLineItem {
  id: number
  product_id: number
  variant_id: number
  title: string
  vendor: string
  properties: Array<{ name: string; value: string }>
}

interface ShopifyOrder {
  id: number
  name: string
  created_at: string
  updated_at: string
  line_items: ShopifyLineItem[]
}

async function fetchShopifyOrders(): Promise<ShopifyOrder[]> {
  const shopifyUrl = process.env.SHOPIFY_STORE_URL
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN

  if (!shopifyUrl || !accessToken) {
    throw new Error("Shopify credentials not configured")
  }

  // Calculate date 30 days ago
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const response = await fetch(
    `${shopifyUrl}/admin/api/2023-10/orders.json?limit=250&created_at_min=${thirtyDaysAgo.toISOString()}&status=any`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch Shopify orders: ${response.statusText}`)
  }

  const data = await response.json()
  return data.orders
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const status = searchParams.get("status") || "all"
    const search = searchParams.get("search") || ""
    const pageSize = 20

    // Fetch orders from both sources
    const [dbOrders, shopifyOrders] = await Promise.all([
      // Fetch from database
      (async () => {
        let query = supabase
          .from("order_line_items")
          .select("*")
          .order("updated_at", { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1)

        if (status !== "all") {
          query = query.eq("status", status)
        }

        if (search) {
          query = query.or(
            `order_name.ilike.%${search}%,order_id.ilike.%${search}%,product_id.ilike.%${search}%`
          )
        }

        const { data: orders, error: ordersError } = await query

        if (ordersError) {
          throw ordersError
        }

        return orders
      })(),
      // Fetch from Shopify
      fetchShopifyOrders()
    ])

    // Get unique product IDs from database orders
    const productIds = [...new Set(dbOrders.map(order => order.product_id))]

    // Fetch product details from our database
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

    // Transform database orders with product details
    const dbOrdersWithDetails = dbOrders.map(order => ({
      ...order,
      product: productMap[order.product_id] || {
        title: "Unknown Product",
        vendor: "Unknown",
        certificate_url: null
      },
      source: "database"
    }))

    // Transform Shopify orders to match our format
    const transformedShopifyOrders = shopifyOrders.map(order => {
      const lineItem = order.line_items[0]
      return {
        order_id: order.id.toString(),
        order_name: order.name,
        line_item_id: lineItem?.id.toString() || "",
        product_id: lineItem?.product_id?.toString() || "",
        variant_id: lineItem?.variant_id?.toString() || "",
        created_at: order.created_at,
        updated_at: order.updated_at,
        status: "active",
        product: {
          title: lineItem?.title || "Unknown Product",
          vendor: lineItem?.vendor || "Unknown",
          certificate_url: lineItem?.properties?.find(p => p.name === "certificate_url")?.value || null
        },
        source: "shopify"
      }
    })

    // Combine and sort all orders by updated_at
    const allOrders = [...dbOrdersWithDetails, ...transformedShopifyOrders]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

    // Apply pagination
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedOrders = allOrders.slice(start, end)

    return NextResponse.json({
      orders: paginatedOrders,
      hasMore: allOrders.length > end,
      total: allOrders.length,
    })
  } catch (error: any) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch orders" },
      { status: 500 }
    )
  }
} 