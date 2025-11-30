import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-session'

// Owner mapping from order numbers to owner names
const OWNER_MAPPING: Record<string, string> = {
  'Simply1': 'Eliran',
  'Simply2': 'Eliran',
  'Simply3': 'Eliran',
  'Simply4': 'Eliran',
  'Simply5': 'Nadav',
  'Simply6': 'Nadav',
  'Simply7': 'Nadav',
  'Simply8': 'Oded',
  'Simply9': 'Oded',
  'Simply10': 'Nadav',
  'Simply11': 'Nadav',
  'Simply12': 'Nadav',
  'Simply13': 'Nadav',
  'Simply14': 'Nadav',
  'Simply15': 'Nadav',
  'Simply16': 'Nadav',
  'Simply17': 'Nadav',
  'Simply18': 'Nadav',
  'Simply19': 'Nadav',
  'Simply20': 'Nadav',
  'Simply21': 'Dan',
  'Simply22': 'Dan',
  'Simply23': 'Oded',
  'Simply24': 'Oded',
  'Simply25': 'Oded',
  'Simply26': 'Oded',
  'Simply27': 'Oded',
  'Simply28': 'shiloah',
  'Simply29': 'shiloah',
  'Simply30': 'shiloah',
  'Simply31': 'Sarah',
  'Simply32': 'Sarah',
  'Simply33': 'Sarah',
  'Simply34': 'Sarah',
  'Simply35': 'Sarah',
  'Simply36': 'Sarah',
  'Simply37': 'Sarah',
  'Simply38': 'Sarah',
  'Simply39': 'Sarah',
  'Simply40': 'Sarah',
  'Simply41': 'Sarah',
  'Simply42': 'Sarah',
  'Simply43': 'Sarah',
  'Simply44': 'Tamar',
  'Simply45': 'Tamar',
  'Simply46': 'Tamar',
  'Simply47': 'Tamar',
  'Simply48': 'Nadav',
  'Simply49': 'Eliran',
  'Simply50': 'shiloah',
  'Simply51': 'Eliran',
  'Simply52': 'Oded',
  'Simply53': 'Oded',
  'Simply54': 'Oded',
  'Simply55': 'Oded',
  'Simply56': 'Nadav',
  'Simply57': 'Nadav',
}

/**
 * POST /api/admin/bulk-create-labels
 * Bulk create labels and assign orders based on owner mapping
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Tracking token is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Verify the tracking link exists
    const { data: trackingLink, error: linkError } = await supabase
      .from('shared_order_tracking_links')
      .select('token, order_ids')
      .eq('token', token)
      .single()

    if (linkError || !trackingLink) {
      return NextResponse.json(
        { success: false, message: `Invalid tracking token: ${token}` },
        { status: 404 }
      )
    }

    // Get unique owner names (labels)
    const uniqueOwners = [...new Set(Object.values(OWNER_MAPPING))]
    
    // Create labels
    const labelsToInsert = uniqueOwners.map((owner, index) => ({
      token,
      label_name: owner,
      label_order: index,
    }))

    // Delete existing labels
    await supabase
      .from('tracking_link_labels')
      .delete()
      .eq('token', token)

    // Insert new labels
    const { error: labelsError } = await supabase
      .from('tracking_link_labels')
      .insert(labelsToInsert)

    if (labelsError) {
      console.error('Error creating labels:', labelsError)
      return NextResponse.json(
        { success: false, message: `Error creating labels: ${labelsError.message}` },
        { status: 500 }
      )
    }

    // Create order-label associations
    const orderLabelsToInsert: Array<{ token: string; order_id: string; label_name: string }> = []

    // Match orders to labels based on order_id
    // Try to match by exact order_id first
    for (const [orderNumber, owner] of Object.entries(OWNER_MAPPING)) {
      // Try different order ID formats
      const possibleOrderIds = [
        orderNumber,           // "Simply1"
        `#${orderNumber}`,     // "#Simply1"
        orderNumber.toLowerCase(), // "simply1"
      ]

      for (const orderId of possibleOrderIds) {
        // Check if this order exists in the tracking link
        if (trackingLink.order_ids?.includes(orderId)) {
          orderLabelsToInsert.push({
            token,
            order_id: orderId,
            label_name: owner,
          })
          break
        }
      }
    }

    // Also try to match by checking if order_id contains the number
    // This handles cases where order_id might be "Simply36a" instead of "Simply36"
    for (const orderId of trackingLink.order_ids || []) {
      // Extract number from order ID (e.g., "Simply36a" -> "36")
      const match = orderId.match(/Simply(\d+)/i)
      if (match) {
        const number = match[1]
        const orderNumber = `Simply${number}`
        const owner = OWNER_MAPPING[orderNumber]
        
        if (owner) {
          // Check if we already added this order
          const exists = orderLabelsToInsert.some(
            ol => ol.token === token && ol.order_id === orderId && ol.label_name === owner
          )
          
          if (!exists) {
            orderLabelsToInsert.push({
              token,
              order_id: orderId,
              label_name: owner,
            })
          }
        }
      }
    }

    // Delete existing order labels
    await supabase
      .from('tracking_link_order_labels')
      .delete()
      .eq('token', token)

    // Insert new order labels
    if (orderLabelsToInsert.length > 0) {
      const { error: orderLabelsError } = await supabase
        .from('tracking_link_order_labels')
        .insert(orderLabelsToInsert)

      if (orderLabelsError) {
        console.error('Error creating order labels:', orderLabelsError)
        return NextResponse.json(
          { success: false, message: `Error creating order labels: ${orderLabelsError.message}` },
          { status: 500 }
        )
      }
    }

    // Calculate label counts
    const labelCounts: Record<string, number> = {}
    orderLabelsToInsert.forEach(ol => {
      labelCounts[ol.label_name] = (labelCounts[ol.label_name] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      message: 'Labels created and orders assigned successfully',
      summary: {
        labelsCreated: uniqueOwners.length,
        ordersAssigned: orderLabelsToInsert.length,
        labelCounts,
      },
    })
  } catch (error: any) {
    console.error('Error in bulk-create-labels:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create labels',
      },
      { status: 500 }
    )
  }
}

