import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSTONE3PLClient } from '@/lib/stone3pl/client'
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-session'

/**
 * GET /api/warehouse/orders/[orderId]/track
 * Get STONE3PL tracking information for an order (Admin only)
 * Returns enhanced tracking with parsed events, timeline, and status information
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

    // Create STONE3PL client and fetch tracking info
    const client = createSTONE3PLClient()
    const trackingInfo = await client.getTracking(orderId.trim())

    // Format response with enhanced tracking information
    const timeline = client.getTrackingTimeline(trackingInfo)
    const formattedTracking = {
      ...trackingInfo,
      timeline,
      parsed_events: client.parseTrackingEvents(trackingInfo.track_list),
      status_info: client.getStatusInfo(trackingInfo.track_status),
    }

    return NextResponse.json({
      success: true,
      tracking: formattedTracking,
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

