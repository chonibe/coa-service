import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

// Using getSupabaseAdmin to ensure consistent environment variables from Vercel
export async function GET(request: NextRequest) {
  try {
    // Check if this is a preview request
    const isPreview = request.headers.get("x-preview-mode") === "true"
    
    // Only check for admin session if not in preview mode
    if (!isPreview) {
      const adminSession = request.cookies.get("admin_session")
      if (!adminSession) {
        console.log("No admin session found")
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
      }
    }

    // Create Supabase client with service role key
    let supabase
    try {
      supabase = getSupabaseAdmin()
      if (!supabase) {
        throw new Error("Failed to initialize Supabase admin client")
      }
    } catch (error) {
      console.error("Error initializing Supabase client:", error)
      return NextResponse.json({ success: false, message: "Database connection error" }, { status: 500 })
    }

    // Fetch line items from the database
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
        nfc_claimed_at
      `)
      .order("created_at", { ascending: false })

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
        nfc_claimed_at: item.nfc_claimed_at
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