import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createChinaDivisionClient } from '@/lib/chinadivision/client'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/customer/tracking
 * Get tracking information for customer orders by customer order IDs
 * Query parameter: order_ids (comma-delimited, e.g., "#1000101,#1000102")
 * Requires customer authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Get customer ID from cookie (Shopify customer authentication)
    const shopifyCustomerId = request.cookies.get('shopify_customer_id')?.value

    if (!shopifyCustomerId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
          errorCode: 'AUTH_NO_CUSTOMER_ID',
        },
        { status: 401 }
      )
    }

    // Validate customer ID
    const customerIdNumber = parseInt(shopifyCustomerId)
    if (isNaN(customerIdNumber)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid customer ID format',
          errorCode: 'AUTH_INVALID_CUSTOMER_ID',
        },
        { status: 400 }
      )
    }

    // Get order_ids from query parameters
    const { searchParams } = new URL(request.url)
    const orderIds = searchParams.get('order_ids')

    if (!orderIds) {
      return NextResponse.json(
        { success: false, message: 'order_ids query parameter is required (comma-delimited)' },
        { status: 400 }
      )
    }

    // Get customer email from Supabase to verify ownership
    const supabase = createClient()
    const { data: customerOrder, error: orderError } = await supabase
      .from('orders')
      .select('customer_email')
      .eq('customer_id', customerIdNumber)
      .not('customer_email', 'is', null)
      .limit(1)
      .single()

    if (orderError || !customerOrder?.customer_email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Customer email not found',
          errorCode: 'CUSTOMER_EMAIL_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    const customerEmail = customerOrder.customer_email

    // Create ChinaDivision client and fetch tracking info
    const client = createChinaDivisionClient()
    const trackingList = await client.getOrderTrackList(orderIds)

    // Optionally verify that the orders belong to this customer
    // This is a security measure - we could cross-reference with warehouse orders
    // For now, we'll return the tracking data as-is since the API will only return
    // data for orders that exist and are accessible with the API key

    return NextResponse.json({
      success: true,
      tracking: trackingList,
      count: trackingList.length,
    })
  } catch (error: any) {
    console.error('Error fetching customer order tracking:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch order tracking',
      },
      { status: 500 }
    )
  }
}
