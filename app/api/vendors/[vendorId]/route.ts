import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"

interface OrderLineItem {
  vendor_name: string
  price: number | string
}

interface Order {
  id: string
  created_at: string
  status: string
  order_line_items_v2: OrderLineItem[]
}

export async function GET(
  request: Request,
  { params }: { params: { vendorId: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get vendor details
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", params.vendorId)
      .single()

    if (vendorError) {
      console.error("Error fetching vendor:", vendorError)
      return NextResponse.json({ error: "Failed to fetch vendor" }, { status: 500 })
    }

    // Get vendor's products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("vendor", params.vendorId)

    if (productsError) {
      console.error("Error fetching products:", productsError)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    // Get recent orders containing vendor's products
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*, order_line_items_v2(*)")
      .eq("order_line_items_v2.vendor_name", params.vendorId)
      .order("created_at", { ascending: false })
      .limit(10)

    if (ordersError) {
      console.error("Error fetching orders:", ordersError)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    // Process orders to get totals
    const processedOrders = (orders as Order[]).map((order) => {
      const vendorItems = order.order_line_items_v2.filter(
        (item) => item.vendor_name === params.vendorId
      )
      const total = vendorItems.reduce((sum: number, item: OrderLineItem) => {
        const price = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price || 0
        return sum + price
      }, 0)

      return {
        id: order.id,
        created_at: order.created_at,
        status: order.status,
        total,
      }
    })

    return NextResponse.json({
      vendor,
      products,
      orders: processedOrders,
    })
  } catch (error) {
    console.error("Unexpected error in vendor details API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
} 