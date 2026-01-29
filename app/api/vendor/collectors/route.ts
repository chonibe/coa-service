import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

// GET: Fetch collectors who own this vendor's artworks
export async function GET() {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()

    // Get all orders for this vendor's products
    const { data: orders, error: ordersError } = await supabase
      .from("order_line_items")
      .select(`
        id,
        order_number,
        created_at,
        price,
        currency,
        product_id,
        email,
        collector_name,
        products:product_id (
          id,
          name,
          img_url,
          vendor_name
        )
      `)
      .eq("products.vendor_name", vendorName)

    if (ordersError) {
      console.error("Error fetching orders:", ordersError)
      return NextResponse.json(
        { error: "Failed to fetch collector data" },
        { status: 500 }
      )
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        collectors: [],
      })
    }

    // Group by collector (email or collector_name)
    const collectorMap = new Map<string, any>()

    for (const order of orders) {
      const collectorKey = order.email || order.collector_name || "Anonymous"
      
      if (!collectorMap.has(collectorKey)) {
        collectorMap.set(collectorKey, {
          id: collectorKey,
          displayName: order.collector_name || order.email || "Anonymous Collector",
          email: order.email,
          totalPurchases: 0,
          totalValue: 0,
          currency: order.currency || "USD",
          lastPurchaseDate: order.created_at,
          artworksPurchased: [],
          engagementScore: Math.floor(Math.random() * 100), // Mock data - would come from analytics
        })
      }

      const collector = collectorMap.get(collectorKey)!
      collector.totalPurchases++
      collector.totalValue += parseFloat(order.price) || 0
      
      if (new Date(order.created_at) > new Date(collector.lastPurchaseDate)) {
        collector.lastPurchaseDate = order.created_at
      }

      // Add artwork to purchased list
      if (order.products) {
        const product = order.products as any
        collector.artworksPurchased.push({
          id: product.id,
          name: product.name,
          imgUrl: product.img_url,
          purchaseDate: order.created_at,
          price: parseFloat(order.price) || 0,
        })
      }
    }

    // Convert map to array
    const collectors = Array.from(collectorMap.values())

    return NextResponse.json({
      success: true,
      collectors,
    })
  } catch (error: any) {
    console.error("Error in collectors API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}
