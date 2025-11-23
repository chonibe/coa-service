import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createChinaDivisionClient } from '@/lib/chinadivision/client'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/customer/warehouse-orders
 * Get warehouse orders for the authenticated customer
 * Filters orders by customer email
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

    // Get customer email from Supabase
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

    // Get query parameters for date range (optional, defaults to last 90 days)
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start') || getDateDaysAgo(90)
    const end = searchParams.get('end') || new Date().toISOString().split('T')[0]

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(start) || !dateRegex.test(end)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD',
        },
        { status: 400 }
      )
    }

    // Create ChinaDivision client and fetch orders
    const client = createChinaDivisionClient()
    const allOrders = await client.getOrdersInfo(start, end)

    // Filter orders by customer email (case-insensitive)
    const customerOrders = allOrders.filter(
      (order) => order.ship_email?.toLowerCase() === customerEmail.toLowerCase()
    )

    return NextResponse.json({
      success: true,
      orders: customerOrders,
      count: customerOrders.length,
      email: customerEmail, // For debugging
    })
  } catch (error: any) {
    console.error('Error fetching customer warehouse orders:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch warehouse orders',
      },
      { status: 500 }
    )
  }
}

/**
 * Helper function to get date string N days ago
 */
function getDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

