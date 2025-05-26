import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

export async function GET(request: NextRequest) {
  const isPreview = request.headers.get("x-preview-mode") === "true"
  const customerId = request.headers.get("x-customer-id")

  if (!customerId) {
    return NextResponse.json(
      { success: false, message: "Customer ID is required" },
      { status: 400 }
    )
  }

  if (!supabase) {
    return NextResponse.json(
      { success: false, message: "Database connection not available" },
      { status: 500 }
    )
  }

  try {
    // Get orders from the database
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        name,
        created_at,
        line_items:order_line_items_v2 (
          id,
          line_item_id,
          order_id,
          name,
          description,
          price,
          quantity,
          vendor_name,
          status,
          created_at,
          img_url,
          edition_number,
          edition_total,
          nfc_tag_id,
          nfc_claimed_at
        )
      `)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })

    if (ordersError) {
      console.error("Error fetching orders:", ordersError)
      return NextResponse.json(
        { success: false, message: "Failed to fetch orders" },
        { status: 500 }
      )
    }

    // If in preview mode, we don't need to fetch additional data from Shopify
    if (isPreview) {
      return NextResponse.json({ success: true, orders })
    }

    // For non-preview mode, fetch additional data from Shopify
    const shopifyOrders = await Promise.all(
      orders.map(async (order) => {
        try {
          const response = await fetch(
            `https://${SHOPIFY_SHOP}/admin/api/2023-10/orders/${order.id}.json`,
            {
              headers: {
                "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
                "Content-Type": "application/json",
              },
            }
          )

          if (!response.ok) {
            console.error(`Failed to fetch Shopify order ${order.id}:`, response.status)
            return order
          }

          const shopifyData = await response.json()
          return {
            ...order,
            shopify_data: shopifyData.order,
          }
        } catch (error) {
          console.error(`Error fetching Shopify order ${order.id}:`, error)
          return order
        }
      })
    )

    return NextResponse.json({ success: true, orders: shopifyOrders })
  } catch (error: any) {
    console.error("Error in orders endpoint:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
} 