import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Verify database connection
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        message: "Database connection error" 
      }, { status: 500 })
    }

    // Get the customer session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 })
    }

    // Comprehensive dashboard data retrieval
    const { data: dashboardData, error: dataError } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        processed_at,
        total_price,
        order_line_items_v2 (
          id,
          product_id,
          name,
          description,
          price,
          quantity,
          nfc_tags (
            id,
            tag_id,
            claimed_at,
            status
          ),
          certificate_url
        )
      `)
      .eq("customer_id", session.user.id)
      .order("processed_at", { ascending: false })

    if (dataError) {
      console.error("Dashboard data retrieval error:", dataError)
      return NextResponse.json({ 
        success: false, 
        message: "Failed to retrieve dashboard data" 
      }, { status: 500 })
    }

    // Transform data for frontend consumption
    const transformedDashboard = dashboardData.map(order => ({
      orderId: order.id,
      orderNumber: order.order_number,
      processedAt: order.processed_at,
      totalPrice: order.total_price,
      lineItems: order.order_line_items_v2.map(lineItem => ({
        id: lineItem.id,
        productId: lineItem.product_id,
        name: lineItem.name,
        description: lineItem.description,
        price: lineItem.price,
        quantity: lineItem.quantity,
        certificateUrl: lineItem.certificate_url,
        nfcTags: lineItem.nfc_tags.map(tag => ({
          id: tag.id,
          tagId: tag.tag_id,
          claimedAt: tag.claimed_at,
          status: tag.status
        }))
      }))
    }))

    return NextResponse.json({
      success: true,
      dashboard: transformedDashboard
    })
  } catch (error: any) {
    console.error("Unexpected dashboard error:", error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || "An unexpected error occurred" 
    }, { status: 500 })
  }
} 