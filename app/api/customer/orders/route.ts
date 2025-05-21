import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ success: false, message: "Database connection error" }, { status: 500 })
    }

    // Get the customer ID from the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error("Error getting session:", sessionError)
      return NextResponse.json({ success: false, message: "Authentication error" }, { status: 401 })
    }

    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    // Get customer's orders
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        name,
        created_at,
        order_line_items (
          line_item_id,
          order_id,
          title,
          quantity,
          price,
          image_url,
          nfc_tag_id,
          nfc_claimed_at,
          certificate_url
        )
      `)
      .eq("customer_id", session.user.id)
      .order("created_at", { ascending: false })

    if (ordersError) {
      console.error("Error fetching orders:", ordersError)
      return NextResponse.json({ success: false, message: "Failed to fetch orders" }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedOrders = orders.map(order => ({
      id: order.id,
      name: order.name,
      created_at: order.created_at,
      line_items: order.order_line_items
    }))

    return NextResponse.json({
      success: true,
      orders: transformedOrders
    })
  } catch (error: any) {
    console.error("Error in customer orders API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
} 