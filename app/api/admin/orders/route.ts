import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      const error = new Error("Database connection error: Supabase admin client not initialized")
      console.error(error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("Fetching line items from order_line_items_v2...")
    
    // Get all orders with line items from order_line_items_v2
    const { data: lineItems, error: lineItemsError } = await supabaseAdmin
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
        status,
        vendor_name,
        edition_number,
        edition_total,
        nfc_tag_id,
        nfc_claimed_at
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    if (lineItemsError) {
      const error = new Error(`Failed to fetch orders: ${lineItemsError.message}`)
      console.error("Supabase error:", {
        error: lineItemsError,
        message: lineItemsError.message,
        code: lineItemsError.code,
        details: lineItemsError.details,
        hint: lineItemsError.hint
      })
      return NextResponse.json({ 
        success: false, 
        message: error.message,
        error: lineItemsError.message,
        code: lineItemsError.code,
        details: lineItemsError.details,
        hint: lineItemsError.hint
      }, { status: 500 })
    }

    if (!lineItems) {
      const error = new Error("No line items returned from database")
      console.error(error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log(`Successfully fetched ${lineItems?.length || 0} line items`)

    // Group line items by order_name
    const ordersMap = new Map()
    lineItems.forEach(item => {
      try {
        if (!ordersMap.has(item.order_name)) {
          ordersMap.set(item.order_name, {
            id: item.order_id,
            name: item.order_name,
            created_at: item.created_at,
            line_items: []
          })
        }
        ordersMap.get(item.order_name).line_items.push({
          line_item_id: item.line_item_id,
          order_id: item.order_id,
          title: item.name,
          quantity: item.quantity,
          price: item.price,
          image_url: item.img_url,
          status: item.status,
          vendor: item.vendor_name,
          edition_number: item.edition_number,
          edition_total: item.edition_total,
          nfc_tag_id: item.nfc_tag_id,
          nfc_claimed_at: item.nfc_claimed_at
        })
      } catch (err) {
        const error = new Error(`Error processing line item: ${err instanceof Error ? err.message : 'Unknown error'}`)
        console.error(error, { item })
        throw error
      }
    })

    const orders = Array.from(ordersMap.values())
    console.log(`Successfully grouped into ${orders.length} orders`)

    return NextResponse.json({
      success: true,
      orders: orders
    })
  } catch (error: any) {
    // Ensure error is properly logged in Vercel
    const serverError = new Error(`Orders API error: ${error.message}`)
    console.error(serverError, {
      originalError: error,
      stack: error.stack,
      name: error.name
    })
    
    return NextResponse.json({ 
      success: false, 
      message: serverError.message,
      error: error.toString(),
      stack: error.stack
    }, { status: 500 })
  }
} 