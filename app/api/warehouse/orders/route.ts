import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createChinaDivisionClient } from '@/lib/chinadivision/client'
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-session'

/**
 * GET /api/warehouse/orders
 * List warehouse orders within a date range (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminSessionToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
    const adminSession = verifyAdminSessionToken(adminSessionToken)
    
    if (!adminSession?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '200', 10)

    // Validate date parameters
    if (!start || !end) {
      return NextResponse.json(
        {
          success: false,
          message: 'Start and end dates are required (format: YYYY-MM-DD)',
        },
        { status: 400 }
      )
    }

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
    try {
      const client = createChinaDivisionClient()
      console.log(`[Warehouse Orders] Fetching orders from ChinaDivision API: ${start} to ${end}`)
      const orders = await client.getOrdersInfo(start, end)
      console.log(`[Warehouse Orders] Successfully fetched ${orders.length} orders`)

      // Don't group orders - keep them separate if Platform Order ID (order_id) is different
      // The client already handles this, so we just return the orders as-is
      const ordersArray = Array.isArray(orders) ? orders : []
      
      // Log status distribution for debugging
      const statusCounts = {
        total: ordersArray.length,
        status0: ordersArray.filter(o => o.status === 0).length,
        status3: ordersArray.filter(o => o.status === 3).length,
        status11: ordersArray.filter(o => o.status === 11).length,
        status23: ordersArray.filter(o => o.status === 23).length,
        other: ordersArray.filter(o => o.status !== 0 && o.status !== 3 && o.status !== 11 && o.status !== 23).length,
      }
      console.log(`[Warehouse Orders] Status distribution:`, statusCounts)
      console.log(`[Warehouse Orders] Returning ${ordersArray.length} orders (separated by Platform Order ID)`)

      // Return all orders - pagination will be handled on client side
      return NextResponse.json({
        success: true,
        orders: ordersArray,
        count: ordersArray.length,
        totalCount: ordersArray.length,
      })
    } catch (apiError: any) {
      console.error('[Warehouse Orders] ChinaDivision API error:', apiError)
      throw apiError
    }
  } catch (error: any) {
    console.error('Error fetching warehouse orders:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch warehouse orders',
      },
      { status: 500 }
    )
  }
}

