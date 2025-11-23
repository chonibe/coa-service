import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSTONE3PLClient } from '@/lib/stone3pl/client'

/**
 * GET /api/tracking/stone3pl
 * Get STONE3PL tracking information for one or more orders
 * Query params:
 *   - order_id: Single order ID (Platform Order No. like "#1000101")
 *   - order_ids: Comma-separated order IDs for batch tracking
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('order_id')
    const orderIdsParam = searchParams.get('order_ids')

    // Support both single and batch tracking
    if (orderIdsParam) {
      // Batch tracking
      const orderIds = orderIdsParam.split(',').map(id => id.trim()).filter(Boolean)
      
      if (orderIds.length === 0) {
        return NextResponse.json(
          { success: false, message: 'At least one order ID is required' },
          { status: 400 }
        )
      }

      try {
        const client = createSTONE3PLClient()
        const trackings = await client.getTrackings(orderIds)

        // Format response with timeline for each tracking
        const formattedTrackings = trackings.map(tracking => {
          const timeline = client.getTrackingTimeline(tracking)
          return {
            ...tracking,
            timeline,
            parsed_events: client.parseTrackingEvents(tracking.track_list),
            status_info: client.getStatusInfo(tracking.track_status),
          }
        })

        return NextResponse.json({
          success: true,
          trackings: formattedTrackings,
          count: formattedTrackings.length,
        })
      } catch (apiError: any) {
        console.error('[STONE3PL] API error:', apiError)
        return NextResponse.json(
          {
            success: false,
            message: apiError.message || 'Failed to fetch tracking information',
          },
          { status: 500 }
        )
      }
    } else if (orderId) {
      // Single order tracking
      try {
        const client = createSTONE3PLClient()
        const tracking = await client.getTracking(orderId)

        // Format response with timeline
        const timeline = client.getTrackingTimeline(tracking)
        const formattedTracking = {
          ...tracking,
          timeline,
          parsed_events: client.parseTrackingEvents(tracking.track_list),
          status_info: client.getStatusInfo(tracking.track_status),
        }

        return NextResponse.json({
          success: true,
          tracking: formattedTracking,
        })
      } catch (apiError: any) {
        console.error('[STONE3PL] API error:', apiError)
        // Handle 404 gracefully - tracking might not be available yet
        if (apiError.message?.includes('404') || apiError.message?.includes('not found') || apiError.message?.includes('Tracking not found')) {
          return NextResponse.json(
            {
              success: false,
              message: 'Tracking information not available yet for this order',
              notFound: true,
            },
            { status: 404 }
          )
        }
        return NextResponse.json(
          {
            success: false,
            message: apiError.message || 'Failed to fetch tracking information',
          },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, message: 'order_id or order_ids parameter is required' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error in STONE3PL tracking API:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to process tracking request',
      },
      { status: 500 }
    )
  }
}

