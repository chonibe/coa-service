import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createChinaDivisionClient } from '@/lib/chinadivision/client'
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-session'

/**
 * GET /api/warehouse/orders/track-list
 * Get tracking information for multiple orders by customer order IDs (Admin only)
 * Query parameter: order_ids (comma-delimited, e.g., "#1000101,#1000102")
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

    // Get order_ids from query parameters
    const { searchParams } = new URL(request.url)
    const orderIds = searchParams.get('order_ids')

    if (!orderIds) {
      return NextResponse.json(
        { success: false, message: 'order_ids query parameter is required (comma-delimited)' },
        { status: 400 }
      )
    }

    // Create ChinaDivision client and fetch tracking info
    const client = createChinaDivisionClient()
    const trackingList = await client.getOrderTrackList(orderIds)

    return NextResponse.json({
      success: true,
      tracking: trackingList,
      count: trackingList.length,
    })
  } catch (error: any) {
    console.error('Error fetching order tracking list:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch order tracking list',
      },
      { status: 500 }
    )
  }
}
