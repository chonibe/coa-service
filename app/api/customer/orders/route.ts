import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "/dev/null"

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      console.error("Supabase connection not available")
      return NextResponse.json({ success: false, message: "Database connection error" }, { status: 500 })
    }

    // Check for customer ID in URL search params first
    const { searchParams } = new URL(request.url)
    const urlCustomerId = searchParams.get('customerId')

    // Get Shopify customer ID from cookies as fallback
    const cookieCustomerId = request.cookies.get('shopify_customer_id')?.value
    
    const shopifyCustomerId = urlCustomerId || cookieCustomerId
    
    console.log('Customer Orders API Debug:', {
      urlCustomerId,
      cookieCustomerId,
      shopifyCustomerId,
      allCookies: request.headers.get('cookie'),
      customerIdExists: !!shopifyCustomerId
    });
    
    if (!shopifyCustomerId) {
      return NextResponse.json({ success: false, message: "Not authenticated - please log in via Shopify" }, { status: 401 })
    }

    // Convert to number and validate
    const customerIdNumber = parseInt(shopifyCustomerId);
    if (isNaN(customerIdNumber)) {
      console.error("Invalid customer ID format:", shopifyCustomerId);
      return NextResponse.json({ success: false, message: "Invalid customer ID format" }, { status: 400 })
    }

    console.log('Querying orders for customer ID:', customerIdNumber);

    // First, get customer's orders (without line items to avoid relationship issues)
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
      .limit(20)

    if (ordersError) {
      console.error("Database query error:", ordersError)
      console.error("Query details:", {
        table: "orders",
        customerIdNumber,
        errorCode: ordersError.code,
        errorMessage: ordersError.message,
        errorDetails: ordersError.details
      });
      return NextResponse.json({ 
        success: false, 
        message: "Database query failed",
        error: ordersError.message 
      }, { status: 500 })
    }

    console.log(`Found ${orders?.length || 0} orders for customer ${customerIdNumber}`);

    // If we have orders, get their line items separately
    interface TransformedOrder {
      id: string;
      order_number: number;
      processed_at: string;
      total_price: number;
      financial_status: string;
      fulfillment_status: string | null;
      line_items: any[];
    }
    
    let transformedOrders: TransformedOrder[] = []
    
    if (orders && orders.length > 0) {
      const orderIds = orders.map(order => order.id)
      const shopifyIds = orders.map(order => order.shopify_id).filter(id => id) // Filter out nulls
      
      console.log('Order Details:', {
        orderCount: orders.length,
        orderIds: orderIds.slice(0, 3), // First 3 IDs
        shopifyIds: shopifyIds.slice(0, 3), // First 3 Shopify IDs
        sampleOrder: orders[0]
      });
      
      // Query line items using shopify_id from orders table (this should work)
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

      console.log('Line Items Query Results:', {
        count: lineItems?.length || 0,
        error: lineItemsError?.message,
        sample: lineItems?.[0],
        queriedShopifyIds: shopifyIds.slice(0, 3)
      });

      if (!lineItems || lineItems.length === 0) {
        console.log('No line items found - checking if table exists and has data');
        // Test query to see if table has any data at all
        const { data: sampleLineItems, error: sampleError } = await supabase
          .from("order_line_items_v2")
          .select("*")
          .limit(5)
        
        console.log('Sample line items from table:', {
          count: sampleLineItems?.length || 0,
          error: sampleError?.message,
          sample: sampleLineItems?.[0]
        });
      }

      console.log(`Found ${lineItems?.length || 0} line items for ${shopifyIds.length} shopify orders`);

      // Combine orders with their line items using shopify_id
      transformedOrders = orders.map(order => ({
        id: order.id as string,
        order_number: order.order_number as number,
        processed_at: order.processed_at as string,
        total_price: order.total_price as number,
        financial_status: order.financial_status as string,
        fulfillment_status: order.fulfillment_status as string | null,
        line_items: lineItems?.filter(item => 
          item.order_id?.toString() === order.shopify_id
        ) || []
      }))
    }

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      count: transformedOrders.length
    })
  } catch (error: any) {
    console.error("Unexpected error in customer orders API:", error)
    console.error("Error stack:", error.stack)
    return NextResponse.json({ 
      success: false, 
      message: "Server error",
      error: error.message || "An unexpected error occurred"
    }, { status: 500 })
  }
} 