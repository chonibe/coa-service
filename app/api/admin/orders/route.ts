import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"

export async function GET(request: NextRequest) {
  try {
    // Check if this is a preview request
    const isPreview = request.headers.get("x-preview-mode") === "true"
    
    // Only check for admin session if not in preview mode
    if (!isPreview) {
      const adminSessionToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
      const adminSession = verifyAdminSessionToken(adminSessionToken)
      if (!adminSession?.email) {
        console.log("Invalid or missing admin session")
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
      }
    }

    // Create Supabase client with service role key
    const supabase = createClient()

    // Fetch line items from the database with product names
    const { data: lineItems, error } = await supabase
      .from("order_line_items_v2")
      .select(`
        id,
        order_id,
        order_name,
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
        nfc_claimed_at,
        product_id
      `)
      .order("created_at", { ascending: false })
    
    // Fetch product names for all unique product IDs
    const productIds = Array.from(new Set((lineItems || []).map(item => item.product_id).filter(Boolean)))
    let productNames: Record<string, string> = {}
    
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("product_id, name")
        .in("product_id", productIds)
      
      if (products) {
        productNames = Object.fromEntries(
          products.map(p => [p.product_id, p.name || 'Unknown Product'])
        )
      }
    }

    if (error) {
      console.error("Error fetching line items:", error)
      return NextResponse.json({ success: false, message: "Failed to fetch orders" }, { status: 500 })
    }

    if (!lineItems || !Array.isArray(lineItems)) {
      console.error("No line items returned or invalid data structure")
      return NextResponse.json({ success: false, message: "No orders found" }, { status: 404 })
    }

    // Group line items by order
    const orders = lineItems.reduce((acc: any, item: any) => {
      const orderName = item.order_name
      if (!acc[orderName]) {
        acc[orderName] = {
          id: item.order_id,
          name: orderName,
          created_at: item.created_at,
          line_items: [],
        }
      }
      acc[orderName].line_items.push({
        id: item.id,
        order_id: item.order_id,
        name: item.name,
        product_name: productNames[item.product_id] || item.name || 'Unknown Product',
        description: item.description,
        price: item.price,
        quantity: item.quantity,
        vendor_name: item.vendor_name,
        status: item.status,
        created_at: item.created_at,
        img_url: item.img_url,
        edition_number: item.edition_number,
        edition_total: item.edition_total,
        nfc_tag_id: item.nfc_tag_id,
        nfc_claimed_at: item.nfc_claimed_at,
        product_id: item.product_id
      })
      return acc
    }, {})

    // Convert to array and sort by creation date
    const ordersArray = Object.values(orders).sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return NextResponse.json({ 
      success: true, 
      orders: ordersArray 
    })
  } catch (error: any) {
    console.error("Error in orders API:", error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || "An error occurred" 
    }, { status: 500 })
  }
} 