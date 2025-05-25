import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"

interface OrderLineItem {
  vendor_name: string
  price: number | string
  quantity: number
  product_id: string
  line_item_id: string
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

    // Convert vendorId to integer
    const vendorId = parseInt(params.vendorId, 10)

    // Validate vendorId
    if (isNaN(vendorId)) {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 })
    }

    console.log("Fetching vendor with ID:", vendorId)

    // Get vendor details
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", vendorId)
      .single()

    if (vendorError) {
      console.error("Error fetching vendor:", vendorError)
      return NextResponse.json({ error: "Failed to fetch vendor" }, { status: 500 })
    }

    console.log("Vendor data:", vendor)

    // Get vendor's products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("vendor", vendor.name)

    if (productsError) {
      console.error("Error fetching products:", productsError)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    console.log("Products data:", products)

    // Get payout settings for products
    const productIds = products.map((p) => p.id)
    const { data: payoutSettings, error: payoutSettingsError } = await supabase
      .from("product_vendor_payouts")
      .select("*")
      .eq("vendor_name", vendor.name)
      .in("product_id", productIds)

    if (payoutSettingsError) {
      console.error("Error fetching payout settings:", payoutSettingsError)
      return NextResponse.json({ error: "Failed to fetch payout settings" }, { status: 500 })
    }

    // Get recent orders containing vendor's products
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*, order_line_items_v2(*)")
      .eq("order_line_items_v2.vendor_name", vendor.name)
      .order("created_at", { ascending: false })
      .limit(10)

    if (ordersError) {
      console.error("Error fetching orders:", ordersError)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    // Calculate sales analytics
    const salesData = (orders as Order[]).flatMap((order) => order.order_line_items_v2 || [])
    const processedItems = new Set()
    let totalSales = 0
    let pendingPayout = 0

    salesData.forEach((item) => {
      if (processedItems.has(item.line_item_id)) return
      processedItems.add(item.line_item_id)

      const price = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price || 0
      const quantity = item.quantity || 1
      totalSales += price * quantity

      const payout = payoutSettings?.find((p) => p.product_id === item.product_id)
      if (payout) {
        if (payout.is_percentage) {
          pendingPayout += (price * payout.payout_amount / 100) * quantity
        } else {
          pendingPayout += payout.payout_amount * quantity
        }
      } else {
        // Default payout if no specific setting found (20%)
        pendingPayout += (price * 0.2) * quantity
      }
    })

    // Enhance products with payout settings and sales data
    const enhancedProducts = products.map((product) => {
      const payout = payoutSettings?.find((p) => p.product_id === product.id)
      const productSales = salesData.filter((item) => item.product_id === product.id)
      const amountSold = productSales.reduce((sum, item) => sum + (item.quantity || 1), 0)

      return {
        ...product,
        payout_amount: payout?.payout_amount || 0,
        is_percentage: payout?.is_percentage || false,
        amountSold,
      }
    })

    return NextResponse.json({
      vendor,
      products: enhancedProducts,
      analytics: {
        totalSales,
        pendingPayout,
        totalOrders: orders.length,
        totalProducts: products.length,
      },
      recentOrders: orders,
    })
  } catch (error) {
    console.error("Unexpected error in vendor details API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
} 