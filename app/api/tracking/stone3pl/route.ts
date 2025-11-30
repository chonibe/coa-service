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
        // Try to get tracking number from query params if available
        const trackingNumber = searchParams.get('tracking_number') || undefined
        
        let actualOrderId = orderId
        let lookupAttempted = false
        
        // If we have a tracking number, use it to find the correct Platform Order No. (sys_order_id)
        // that STONE3PL recognizes, as the provided order_id might not match what STONE3PL expects
        if (trackingNumber) {
          console.log('[STONE3PL API] Looking up order by tracking number to find Platform Order No.:', trackingNumber)
          lookupAttempted = true
          try {
            const { createChinaDivisionClient } = await import('@/lib/chinadivision/client')
            const chinaClient = createChinaDivisionClient()
            const today = new Date().toISOString().split('T')[0]
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
            const startDate = sixMonthsAgo.toISOString().split('T')[0]
            
            const allOrders = await chinaClient.getOrdersInfo(startDate, today, true)
            const foundOrder = allOrders.find(o => 
              o.tracking_number === trackingNumber ||
              o.sys_order_id === trackingNumber ||
              (o.info && o.info.some(pkg => pkg.tracking_number === trackingNumber))
            )
            
            if (foundOrder) {
              // sys_order_id is the Platform Order No. that STONE3PL uses
              // Prefer sys_order_id over order_id as it's what STONE3PL recognizes
              actualOrderId = foundOrder.sys_order_id || foundOrder.order_id || orderId
              console.log('[STONE3PL API] Found order by tracking number:', {
                trackingNumber,
                providedOrderId: orderId,
                foundOrderId: foundOrder.order_id,
                foundSysOrderId: foundOrder.sys_order_id,
                usingOrderId: actualOrderId
              })
            } else {
              console.warn('[STONE3PL API] Could not find order by tracking number, will try provided order_id:', trackingNumber, orderId)
            }
          } catch (lookupError) {
            console.warn('[STONE3PL API] Failed to lookup order by tracking number, will try provided order_id:', lookupError)
            // Continue with original orderId
          }
        }
        
        // Try to get tracking with the found/actual order ID
        let tracking
        try {
          tracking = await client.getTracking(actualOrderId, trackingNumber)
        } catch (firstAttemptError: any) {
          // If lookup was attempted and failed, try with the original order_id as fallback
          if (lookupAttempted && actualOrderId !== orderId && firstAttemptError.message?.includes('not found')) {
            console.log('[STONE3PL API] First attempt failed, trying with original order_id:', orderId)
            try {
              tracking = await client.getTracking(orderId, trackingNumber)
              actualOrderId = orderId
            } catch (secondAttemptError: any) {
              // Both attempts failed, throw the original error
              throw firstAttemptError
            }
          } else {
            throw firstAttemptError
          }
        }

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

