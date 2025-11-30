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

async function processTrackingLink(supabase: any, token: string, orderIds: string[]) {
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
    throw new Error(`Error creating labels: ${labelsError.message}`)
  }

  // Create order-label associations
  const orderLabelsToInsert: Array<{ token: string; order_id: string; label_name: string }> = []

  // Match orders to labels based on order_id
  for (const orderId of orderIds || []) {
    // Extract number from order ID (e.g., "Simply36a" -> "36")
    const match = orderId.match(/Simply(\d+)/i)
    if (match) {
      const number = match[1]
      const orderNumber = `Simply${number}`
      const owner = OWNER_MAPPING[orderNumber]
      
      if (owner) {
        orderLabelsToInsert.push({
          token,
          order_id: orderId,
          label_name: owner,
        })
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
      throw new Error(`Error creating order labels: ${orderLabelsError.message}`)
    }
  }

  // Calculate label counts
  const labelCounts: Record<string, number> = {}
  orderLabelsToInsert.forEach(ol => {
    labelCounts[ol.label_name] = (labelCounts[ol.label_name] || 0) + 1
  })

  return {
    token,
    labelsCreated: uniqueOwners.length,
    ordersAssigned: orderLabelsToInsert.length,
    labelCounts,
  }
}

/**
 * POST /api/admin/bulk-create-labels-all
 * Bulk create labels and assign orders for ALL tracking links
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

    const supabase = createClient()

    // Get all tracking links
    const { data: trackingLinks, error: linksError } = await supabase
      .from('shared_order_tracking_links')
      .select('token, order_ids')
      .order('created_at', { ascending: false })

    if (linksError) {
      return NextResponse.json(
        { success: false, message: `Error fetching tracking links: ${linksError.message}` },
        { status: 500 }
      )
    }

    if (!trackingLinks || trackingLinks.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No tracking links found' },
        { status: 404 }
      )
    }

    // Process all tracking links
    const results = []
    const errors = []

    for (const link of trackingLinks) {
      try {
        const result = await processTrackingLink(supabase, link.token, link.order_ids || [])
        results.push(result)
      } catch (error: any) {
        errors.push({
          token: link.token,
          error: error.message,
        })
      }
    }

    // Calculate totals
    const totalLabels = results.reduce((sum, r) => sum + r.labelsCreated, 0)
    const totalOrders = results.reduce((sum, r) => sum + r.ordersAssigned, 0)
    const combinedLabelCounts: Record<string, number> = {}
    results.forEach(r => {
      Object.entries(r.labelCounts).forEach(([label, count]) => {
        combinedLabelCounts[label] = (combinedLabelCounts[label] || 0) + count
      })
    })

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} tracking links`,
      summary: {
        linksProcessed: results.length,
        linksWithErrors: errors.length,
        totalLabelsCreated: totalLabels,
        totalOrdersAssigned: totalOrders,
        combinedLabelCounts,
      },
      results,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Error in bulk-create-labels-all:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create labels',
      },
      { status: 500 }
    )
  }
}

