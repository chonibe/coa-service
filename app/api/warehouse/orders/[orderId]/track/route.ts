import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createChinaDivisionClient } from '@/lib/chinadivision/client'
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-session'

/**
 * GET /api/warehouse/orders/[orderId]/track
 * Get order tracking information (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
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

    const { orderId } = params

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Create ChinaDivision client and fetch tracking info
    const client = createChinaDivisionClient()
    const trackingInfo = await client.getOrderTrack(orderId)

    return NextResponse.json({
      success: true,
      tracking: trackingInfo,
    })
  } catch (error: any) {
    console.error('Error fetching order tracking:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch order tracking',
      },
      { status: 500 }
    )
  }
}

