import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createChinaDivisionClient } from '@/lib/chinadivision/client'
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-session'

/**
 * GET /api/warehouse/orders/[orderId]
 * Get single warehouse order details (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> | { orderId: string } }
) {
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

    // Handle both sync and async params (Next.js 15 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params
    const orderId = resolvedParams.orderId

    if (!orderId || orderId.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Create ChinaDivision client and fetch order
    const client = createChinaDivisionClient()
    
    // Try to fetch the order - the API expects the Platform Order No. (order_id)
    // If that fails, we'll try with sys_order_id format
    let order
    try {
      order = await client.getOrderInfo(orderId.trim())
    } catch (firstError: any) {
      // If the first attempt fails and the orderId looks like a sys_order_id (starts with 'S'),
      // try to find the order from the list instead
      console.warn(`[Warehouse Order Details] Failed to fetch order with ID "${orderId}":`, firstError.message)
      
      // Try fetching from orders list to get the Platform Order No.
      try {
        const today = new Date().toISOString().split('T')[0]
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        const startDate = sixMonthsAgo.toISOString().split('T')[0]
        
        const allOrders = await client.getOrdersInfo(startDate, today, true)
        const foundOrder = allOrders.find(o => 
          o.sys_order_id === orderId.trim() || 
          o.order_id === orderId.trim() ||
          o.order_detail_id === orderId.trim()
        )
        
        if (foundOrder) {
          order = foundOrder
        } else {
          throw firstError // Re-throw original error if not found
        }
      } catch (fallbackError) {
        throw firstError // Re-throw original error
      }
    }

    return NextResponse.json({
      success: true,
      order,
    })
  } catch (error: any) {
    console.error('Error fetching warehouse order:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch warehouse order',
      },
      { status: 500 }
    )
  }
}

