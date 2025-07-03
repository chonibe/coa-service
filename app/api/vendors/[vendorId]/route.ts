import { getSupabaseUrl, getSupabaseKey } from '@/lib/supabase/client-utils'
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"

interface OrderLineItem {
  id: number
  order_id: string
  product_id: string
  vendor_name: string
  price: number
  quantity: number
  status: string
  created_at: string
}

interface Product {
  id: string
  vendor_name: string
  name: string
  description: string | null
  price: number
  handle: string | null
  sku: string | null
  edition_size: string | null
  product_id: string
  image_url: string | null
  payout_amount?: number
  is_percentage?: boolean
  amountSold?: number
}

interface Vendor {
  id: number
  vendor_name: string
  instagram_url: string | null
  notes: string | null
  paypal_email: string | null
  payout_method: string
  tax_id: string | null
  tax_country: string | null
  is_company: boolean
  status: string
  contact_name: string | null
  contact_email: string | null
  phone: string | null
  address: string | null
  website: string | null
}

export async function GET(
  request: Request,
  { params }: { params: { vendorId: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Try to parse vendorId as integer
    const numericId = parseInt(params.vendorId, 10)
    const isNumericId = !isNaN(numericId)

    // Get vendor details
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq(isNumericId ? "id" : "vendor_name", isNumericId ? numericId : params.vendorId)
      .single()

    if (vendorError) {
      console.error("Error fetching vendor:", vendorError)
      return NextResponse.json({ error: "Failed to fetch vendor" }, { status: 500 })
    }

    if (!vendor || !vendor.vendor_name) {
      console.error("Vendor data is missing or invalid:", vendor)
      return NextResponse.json({ error: "Invalid vendor data" }, { status: 500 })
    }

    // Get vendor's products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("vendor_name", vendor.vendor_name)

    if (productsError) {
      console.error("Error fetching products:", productsError)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    // Get payout settings for products
    const productIds = products.map((p) => p.id)
    const { data: payoutSettings, error: payoutSettingsError } = await supabase
      .from("product_vendor_payouts")
      .select("*")
      .eq("vendor_name", vendor.vendor_name)
      .in("product_id", productIds)

    if (payoutSettingsError) {
      console.error("Error fetching payout settings:", payoutSettingsError)
      return NextResponse.json({ error: "Failed to fetch payout settings" }, { status: 500 })
    }

    // Get recent orders containing vendor's products
    const { data: orderLineItems, error: orderLineItemsError } = await supabase
      .from("order_line_items_v2")
      .select("*")
      .eq("vendor_name", vendor.vendor_name)
      .order("created_at", { ascending: false })
      .limit(100)

    if (orderLineItemsError) {
      console.error("Error fetching order line items:", orderLineItemsError)
      return NextResponse.json({ error: "Failed to fetch order line items" }, { status: 500 })
    }

    // Calculate sales analytics
    let totalSales = 0
    let pendingPayout = 0
    const productSales = new Map<string, number>()

    orderLineItems.forEach((item: OrderLineItem) => {
      const price = item.price
      const quantity = item.quantity || 1
      totalSales += price * quantity

      // Track product sales
      const currentSales = productSales.get(item.product_id) || 0
      productSales.set(item.product_id, currentSales + quantity)

      // Calculate payout
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
      const amountSold = productSales.get(product.id) || 0

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
        totalOrders: new Set(orderLineItems.map(item => item.order_id)).size,
        totalProducts: products.length,
      },
      recentOrders: orderLineItems,
    })
  } catch (error) {
    console.error("Unexpected error in vendor details API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
} 