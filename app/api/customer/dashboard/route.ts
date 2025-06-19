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

    // Get Shopify customer ID from cookies instead of session
    const shopifyCustomerId = request.cookies.get('shopify_customer_id')?.value
    
    if (!shopifyCustomerId) {
      return NextResponse.json({ 
        success: false, 
        message: "Not authenticated - please log in via Shopify" 
      }, { status: 401 })
    }

    // Comprehensive dashboard data retrieval using Shopify customer ID
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
          nfc_tag_id,
          nfc_claimed_at,
          certificate_url,
          certificate_token,
          edition_number,
          vendor_name,
          status,
          img_url
        )
      `)
      .eq("shopify_customer_id", parseInt(shopifyCustomerId))
      .order("processed_at", { ascending: false })

    if (dataError) {
      console.error("Dashboard data retrieval error:", dataError)
      return NextResponse.json({ 
        success: false, 
        message: "Failed to retrieve dashboard data" 
      }, { status: 500 })
    }

    // Transform data for frontend consumption
    const transformedDashboard = (dashboardData || []).map((order: any) => ({
      orderId: order.id,
      orderNumber: order.order_number,
      processedAt: order.processed_at,
      totalPrice: order.total_price,
      lineItems: (order.order_line_items_v2 || []).map((lineItem: any) => ({
        id: lineItem.id,
        productId: lineItem.product_id,
        name: lineItem.name,
        description: lineItem.description,
        price: lineItem.price,
        quantity: lineItem.quantity,
        certificateUrl: lineItem.certificate_url,
        nfcTagId: lineItem.nfc_tag_id,
        nfcClaimedAt: lineItem.nfc_claimed_at,
        editionNumber: lineItem.edition_number,
        vendorName: lineItem.vendor_name,
        status: lineItem.status,
        imgUrl: lineItem.img_url
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