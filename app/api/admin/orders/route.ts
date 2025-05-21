import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ success: false, message: "Database connection error" }, { status: 500 })
    }

    // Get all orders with line items from order_line_items_v2
    const { data: lineItems, error: lineItemsError } = await supabase
      .from("order_line_items_v2")
      .select(`
        line_item_id,
        order_id,
        order_name,
        created_at,
        name,
        quantity,
        price,
        img_url,
        nfc_tag_id,
        nfc_claimed_at,
        certificate_url
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    if (lineItemsError) {
      console.error("Error fetching line items:", lineItemsError)
      return NextResponse.json({ success: false, message: "Failed to fetch orders" }, { status: 500 })
    }

    // Group line items by order
    const ordersMap = new Map()
    lineItems.forEach(item => {
      if (!ordersMap.has(item.order_id)) {
        ordersMap.set(item.order_id, {
          id: item.order_id,
          name: item.order_name,
          created_at: item.created_at,
          line_items: []
        })
      }
      ordersMap.get(item.order_id).line_items.push({
        line_item_id: item.line_item_id,
        order_id: item.order_id,
        title: item.name,
        quantity: item.quantity,
        price: item.price,
        image_url: item.img_url,
        nfc_tag_id: item.nfc_tag_id,
        nfc_claimed_at: item.nfc_claimed_at,
        certificate_url: item.certificate_url
      })
    })

    const orders = Array.from(ordersMap.values())

    return NextResponse.json({
      success: true,
      orders: orders
    })
  } catch (error: any) {
    console.error("Error in orders API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
} 