import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createChinaDivisionClient } from '@/lib/chinadivision/client'

/**
 * GET /api/tracking/[linkId]
 * Get tracking information for a shared tracking link (public, no auth required)
 * Returns order tracking data and branding information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    const { linkId } = params

    if (!linkId) {
      return NextResponse.json(
        { success: false, message: 'Link ID is required' },
        { status: 400 }
      )
    }

    // Fetch shared tracking link from database
    const supabase = createClient()
    const { data: trackingLink, error: linkError } = await supabase
      .from('shared_order_tracking_links')
      .select('*')
      .eq('id', linkId)
      .single()

    if (linkError || !trackingLink) {
      return NextResponse.json(
        { success: false, message: 'Tracking link not found' },
        { status: 404 }
      )
    }

    // Extract order IDs from the link
    // Assuming order_ids is stored as a comma-delimited string or array
    let orderIds: string = ''
    
    if (trackingLink.order_ids) {
      if (Array.isArray(trackingLink.order_ids)) {
        orderIds = trackingLink.order_ids.join(',')
      } else if (typeof trackingLink.order_ids === 'string') {
        orderIds = trackingLink.order_ids
      }
    }

    if (!orderIds) {
      return NextResponse.json(
        { success: false, message: 'No order IDs found in tracking link' },
        { status: 400 }
      )
    }

    // Fetch tracking data from ChinaDivision
    const client = createChinaDivisionClient()
    const trackingList = await client.getOrderTrackList(orderIds)

    return NextResponse.json({
      success: true,
      tracking: trackingList,
      count: trackingList.length,
      branding: {
        logo_url: trackingLink.logo_url || null,
        primary_color: trackingLink.primary_color || '#8217ff',
      },
    })
  } catch (error: any) {
    console.error('Error fetching tracking link data:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch tracking data',
      },
      { status: 500 }
    )
  }
}
