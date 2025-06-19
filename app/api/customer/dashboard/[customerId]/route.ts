import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

interface LineItem {
  id: string
  line_item_id: string
  product_id: string
  name: string
  description?: string
  price: number
  quantity: number
  nfc_tag_id: string | null
  certificate_url: string
  certificate_token?: string
  nfc_claimed_at?: string | null
  edition_number?: number | null
  edition_total?: number | null
  vendor_name?: string
  status?: string
  img_url?: string
}

interface Order {
  id: string
  order_number: number
  processed_at: string
  total_price: number
  financial_status: string
  fulfillment_status: string | null
  line_items: LineItem[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params

    // Verify database connection
    if (!supabase) {
      console.error("Customer Dashboard API: No Supabase connection")
      return NextResponse.json({ 
        success: false, 
        message: "Database connection error" 
      }, { status: 500 })
    }

    // Get orders with comprehensive line item data
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        processed_at,
        total_price,
        financial_status,
        fulfillment_status,
        line_items:order_line_items (
          id,
          line_item_id,
          product_id,
          name,
          description,
          price,
          quantity,
          nfc_tag_id,
          nfc_claimed_at,
          certificate_url,
          certificate_token,
          edition_number,
          edition_total,
          vendor_name,
          status,
          img_url
        )
      `)
      .eq("shopify_customer_id", customerId)
      .order("processed_at", { ascending: false })

    if (ordersError) {
      console.error("Customer Dashboard API Error:", ordersError)
      return NextResponse.json({ 
        success: false, 
        message: "Failed to fetch orders" 
      }, { status: 500 })
    }

    if (!orders) {
      return NextResponse.json({ 
        success: false, 
        message: "No orders found" 
      }, { status: 404 })
    }

    // Transform data for frontend
    const transformedOrders = orders.map((order: any) => ({
      id: order.id,
      order_number: order.order_number,
      processed_at: order.processed_at,
      total_price: order.total_price,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      line_items: (order.line_items || []).map((item: any) => ({
        line_item_id: item.line_item_id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        img_url: item.img_url,
        nfc_tag_id: item.nfc_tag_id,
        certificate_url: item.certificate_url,
        certificate_token: item.certificate_token,
        nfc_claimed_at: item.nfc_claimed_at,
        order_id: order.id,
        edition_number: item.edition_number,
        edition_total: item.edition_total,
        vendor_name: item.vendor_name,
        status: item.status
      }))
    }))

    return NextResponse.json({ 
      success: true, 
      data: transformedOrders 
    })

  } catch (error) {
    console.error("Customer Dashboard API Error:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error" 
    }, { status: 500 })
  }
} 