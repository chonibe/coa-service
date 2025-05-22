import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Check for admin session cookie
    const adminSession = request.cookies.get('admin_session')

    if (!adminSession) {
      console.log("No admin session cookie found")
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    console.log("Fetching line items from order_line_items_v2...")
    
    // Get all orders with line items from order_line_items_v2
    const { data: lineItems, error: lineItemsError } = await supabase
      .from("order_line_items_v2")
      .select(`
        id,
        order_id,
        order_name,
        line_item_id,
        product_id,
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
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    if (lineItemsError) {
      console.error("Supabase error:", {
        error: lineItemsError,
        message: lineItemsError.message,
        code: lineItemsError.code,
        details: lineItemsError.details,
        hint: lineItemsError.hint
      })
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch orders',
        error: lineItemsError.message
      }, { status: 500 })
    }

    if (!lineItems) {
      console.log("No line items found")
      return NextResponse.json({ 
        success: false, 
        message: 'No line items found'
      }, { status: 404 })
    }

    console.log(`Successfully fetched ${lineItems.length} line items`)

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
        console.error("Error processing line item:", err, { item })
        throw err
      }
    })

    const orders = Array.from(ordersMap.values())
    console.log(`Successfully grouped into ${orders.length} orders`)

    return NextResponse.json({
      success: true,
      orders: orders
    })
  } catch (error: any) {
    console.error("Error in orders API:", error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    }, { status: 500 })
  }
} 