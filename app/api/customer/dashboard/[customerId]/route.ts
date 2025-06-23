import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest, 
  { params }: { params: { customerId: string } }
) {
  try {
    // Comprehensive logging for debugging
    const requestDebug = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      cookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.name === 'shopify_customer_id' ? 'REDACTED' : c.value])),
      params: params
    }

    console.log('CUSTOMER DASHBOARD REQUEST DEBUG:', JSON.stringify(requestDebug, null, 2))

    // Validate Supabase connection
    if (!supabase) {
      console.error('SUPABASE CONNECTION ERROR: No Supabase client available')
      return NextResponse.json({ 
        success: false, 
        message: "Supabase connection failed",
        errorCode: "SUPABASE_CONNECTION_ERROR",
        requestContext: requestDebug
      }, { status: 500 })
    }

    // Validate customer ID
    const customerId = params.customerId
    if (!customerId) {
      return NextResponse.json({ 
        success: false, 
        message: "Customer ID is required",
        errorCode: "MISSING_CUSTOMER_ID",
        requestContext: requestDebug
      }, { status: 400 })
    }

    // Fetch orders directly from orders table
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        processed_at,
        total_price,
        financial_status,
        fulfillment_status,
        shopify_id,
        shopify_customer_id,
        order_line_items_v2 (
          id,
          line_item_id,
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
        )
      `)
      .eq("shopify_customer_id", customerId)
      .order("processed_at", { ascending: false })
      .limit(50)

    console.log('Supabase Order Query Details:', {
      query: 'orders',
      filterColumn: 'shopify_customer_id',
      filterValue: customerId,
      limit: 50,
      queryError: ordersError
    })

    if (ordersError) {
      console.error('Orders Retrieval Error:', {
        error: ordersError,
        customerId: customerId,
        requestContext: requestDebug
      })

      return NextResponse.json({ 
        success: false, 
        message: "Failed to retrieve orders",
        errorCode: "DB_QUERY_FAILED",
        technicalDetails: ordersError.message,
        requestContext: requestDebug
      }, { status: 500 })
    }

    // Check if any orders exist
    if (!orders || orders.length === 0) {
      console.warn('No orders found for customer', {
        customerId: customerId,
        requestContext: requestDebug
      })

      return NextResponse.json({ 
        success: true,
        orders: [],
        count: 0,
        message: `No orders found for customer ${customerId}`,
        requestContext: requestDebug
      })
    }

    // Log raw orders data for debugging
    console.log('Raw Orders Data:', {
      orderCount: orders.length,
      firstOrder: orders[0] ? {
        id: orders[0].id,
        orderNumber: orders[0].order_number,
        shopifyCustomerId: orders[0].shopify_customer_id,
        lineItemsCount: orders[0].order_line_items_v2?.length || 0
      } : null
    })

    // Transform orders for frontend consumption
    const transformedOrders = orders.map(order => ({
      id: order.id,
      order_number: order.order_number,
      processed_at: order.processed_at,
      total_price: order.total_price,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      line_items: order.order_line_items_v2 || []
    }))

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      count: transformedOrders.length,
      message: `Retrieved ${transformedOrders.length} orders for customer ${customerId}`,
      customerDetails: {
        shopifyCustomerId: customerId
      },
      requestContext: requestDebug
    })
  } catch (error: any) {
    console.error('Unexpected Dashboard Error:', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    })

    return NextResponse.json({ 
      success: false, 
      message: "Unexpected server error",
      errorCode: "UNEXPECTED_SERVER_ERROR",
      technicalDetails: error.message || "An unhandled exception occurred"
    }, { status: 500 })
  }
}

// Enable CORS for development and testing
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Customer-ID",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
    },
  })
} 