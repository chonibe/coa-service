import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      console.error("Supabase connection not available")
      return NextResponse.json({ 
        success: false, 
        message: "Database connection error", 
        errorCode: "DB_CONNECTION_FAILED" 
      }, { status: 500 })
    }

    // Enhanced customer ID retrieval
    const { searchParams } = new URL(request.url)
    const urlCustomerId = searchParams.get('customerId')
    const cookieCustomerId = request.cookies.get('shopify_customer_id')?.value
    const headerCustomerId = request.headers.get('X-Customer-ID')
    
    const shopifyCustomerId = urlCustomerId || cookieCustomerId || headerCustomerId
    
    // Detailed logging for debugging
    console.log('Customer Orders API Authentication Debug:', {
      retrievalMethods: {
        urlParam: !!urlCustomerId,
        cookie: !!cookieCustomerId,
        header: !!headerCustomerId
      },
      customerIdSource: shopifyCustomerId ? 'Found' : 'Not Found',
      allCookies: request.headers.get('cookie')
    });
    
    // Enhanced authentication check
    if (!shopifyCustomerId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication failed - customer ID not found", 
        errorCode: "AUTH_NO_CUSTOMER_ID",
        possibleReasons: [
          "Not logged in",
          "Session expired",
          "Missing customer identification"
        ]
      }, { status: 401 })
    }

    // Robust customer ID validation
    const customerIdNumber = parseInt(shopifyCustomerId);
    if (isNaN(customerIdNumber)) {
      console.error("Invalid customer ID format:", shopifyCustomerId);
      return NextResponse.json({ 
        success: false, 
        message: "Invalid customer ID format", 
        errorCode: "AUTH_INVALID_CUSTOMER_ID",
        providedId: shopifyCustomerId
      }, { status: 400 })
    }

    // First, get customer's orders
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        processed_at,
        total_price,
        financial_status,
        fulfillment_status,
        shopify_id
      `)
      .eq("customer_id", customerIdNumber)
      .order("processed_at", { ascending: false })
      .limit(50)  // Increased from 20 to 50 for more comprehensive results

    if (ordersError) {
      console.error("Database query error for orders:", {
        errorCode: ordersError.code,
        errorMessage: ordersError.message,
        errorDetails: ordersError.details
      });
      return NextResponse.json({ 
        success: false, 
        message: "Failed to retrieve orders",
        errorCode: "DB_QUERY_FAILED",
        technicalDetails: ordersError.message
      }, { status: 500 })
    }

    // If no orders found, return informative response
    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        orders: [],
        count: 0,
        message: "No orders found for this customer"
      }, { status: 200 })
    }

    // Fetch line items for these orders
    const shopifyIds = orders.map(order => order.shopify_id).filter(id => id)
    
    const { data: lineItems, error: lineItemsError } = await supabase
      .from("order_line_items_v2")
      .select(`
        line_item_id,
        order_id,
        name,
        description,
        quantity,
        price,
        img_url,
        nfc_tag_id,
        nfc_claimed_at,
        certificate_url,
        certificate_token,
        edition_number,
        vendor_name,
        status
      `)
      .in("order_id", shopifyIds)

    if (lineItemsError) {
      console.error("Line items query error:", {
        errorCode: lineItemsError.code,
        errorMessage: lineItemsError.message
      });
    }

    // Transform orders with their line items
    const transformedOrders = orders.map(order => ({
      id: order.id as string,
      order_number: order.order_number as number,
      processed_at: order.processed_at as string,
      total_price: order.total_price as number,
      financial_status: order.financial_status as string,
      fulfillment_status: order.fulfillment_status as string | null,
      line_items: (lineItems || []).filter(item => 
        item.order_id?.toString() === order.shopify_id
      ) || []
    }))

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      count: transformedOrders.length,
      message: `Retrieved ${transformedOrders.length} orders`
    })
  } catch (error: any) {
    console.error("Unexpected error in customer orders API:", {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    });
    
    return NextResponse.json({ 
      success: false, 
      message: "Unexpected server error",
      errorCode: "UNEXPECTED_SERVER_ERROR",
      technicalDetails: error.message || "An unhandled exception occurred"
    }, { status: 500 })
  }
} 