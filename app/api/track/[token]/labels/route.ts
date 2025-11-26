import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/track/[token]/labels
 * Get all labels, order-label associations, and label emails for a tracking link
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Verify the tracking link exists
    const { data: trackingLink, error: linkError } = await supabase
      .from('shared_order_tracking_links')
      .select('token')
      .eq('token', token)
      .single()

    if (linkError || !trackingLink) {
      return NextResponse.json(
        { success: false, message: 'Invalid tracking token' },
        { status: 404 }
      )
    }

    // Fetch all labels for this token
    // Try to fetch with label_order, but handle case where column doesn't exist yet
    let labels: any[] = []
    
    // First try with label_order
    let result = await supabase
      .from('tracking_link_labels')
      .select('label_name, label_order')
      .eq('token', token)
    
    // If error is about missing column, try without label_order
    if (result.error && (result.error.message?.includes('column') || result.error.message?.includes('label_order') || result.error.code === 'PGRST116')) {
      result = await supabase
        .from('tracking_link_labels')
        .select('label_name')
        .eq('token', token)
        .order('label_name')
      
      if (result.error) {
        // If table doesn't exist, return empty arrays
        if (result.error.code === 'PGRST116' || result.error.message?.includes('does not exist')) {
          return NextResponse.json({
            success: true,
            data: {
              allCreatedLabels: [],
              orderLabels: {},
              labelEmails: {},
              labelOrder: [],
            },
          })
        }
        console.error('Error fetching labels:', result.error)
        return NextResponse.json(
          { success: false, message: 'Failed to fetch labels' },
          { status: 500 }
        )
      }
      
      labels = (result.data || []).map((l: any) => ({
        label_name: l.label_name,
        label_order: null
      }))
    } else if (result.error) {
      // If table doesn't exist, return empty arrays
      if (result.error.code === 'PGRST116' || result.error.message?.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          data: {
            allCreatedLabels: [],
            orderLabels: {},
            labelEmails: {},
            labelOrder: [],
          },
        })
      }
      console.error('Error fetching labels:', result.error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch labels' },
        { status: 500 }
      )
    } else {
      labels = result.data || []
    }

    // Fetch all order-label associations
    let orderLabelsResult = await supabase
      .from('tracking_link_order_labels')
      .select('order_id, label_name')
      .eq('token', token)

    // If table doesn't exist, use empty array
    let orderLabels = orderLabelsResult.data || []
    if (orderLabelsResult.error && (orderLabelsResult.error.code === 'PGRST116' || orderLabelsResult.error.message?.includes('does not exist'))) {
      orderLabels = []
    } else if (orderLabelsResult.error) {
      console.error('Error fetching order labels:', orderLabelsResult.error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch order labels' },
        { status: 500 }
      )
    }

    // Fetch all label emails
    let labelEmailsResult = await supabase
      .from('tracking_link_label_emails')
      .select('label_name, email')
      .eq('token', token)

    // If table doesn't exist, use empty array
    let labelEmails = labelEmailsResult.data || []
    if (labelEmailsResult.error && (labelEmailsResult.error.code === 'PGRST116' || labelEmailsResult.error.message?.includes('does not exist'))) {
      labelEmails = []
    } else if (labelEmailsResult.error) {
      console.error('Error fetching label emails:', labelEmailsResult.error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch label emails' },
        { status: 500 }
      )
    }

    // Transform data into the format expected by the frontend
    // Sort by label_order, then by label_name for labels without order
    const sortedLabels = (labels || []).sort((a, b) => {
      const orderA = a.label_order ?? 999999
      const orderB = b.label_order ?? 999999
      if (orderA !== orderB) return orderA - orderB
      return (a.label_name || '').localeCompare(b.label_name || '')
    })
    const allCreatedLabels = sortedLabels.map(l => l.label_name)
    const labelOrder = sortedLabels.map((l, index) => ({
      label: l.label_name,
      order: l.label_order ?? index
    }))

    // Group order labels by order_id
    const orderLabelsMap: Record<string, string[]> = {}
    orderLabels.forEach((ol: any) => {
      if (!orderLabelsMap[ol.order_id]) {
        orderLabelsMap[ol.order_id] = []
      }
      orderLabelsMap[ol.order_id].push(ol.label_name)
    })

    // Group label emails by label_name
    const labelEmailsMap: Record<string, string[]> = {}
    labelEmails.forEach((le: any) => {
      if (!labelEmailsMap[le.label_name]) {
        labelEmailsMap[le.label_name] = []
      }
      labelEmailsMap[le.label_name].push(le.email)
    })

    return NextResponse.json({
      success: true,
      data: {
        allCreatedLabels,
        orderLabels: orderLabelsMap,
        labelEmails: labelEmailsMap,
        labelOrder: labelOrder.map(lo => lo.label),
      },
    })
  } catch (error: any) {
    console.error('Error in GET /api/track/[token]/labels:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch labels',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/track/[token]/labels
 * Save labels, order-label associations, and label emails for a tracking link
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { allCreatedLabels, orderLabels, labelEmails, labelOrder } = body

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Verify the tracking link exists
    const { data: trackingLink, error: linkError } = await supabase
      .from('shared_order_tracking_links')
      .select('token')
      .eq('token', token)
      .single()

    if (linkError || !trackingLink) {
      return NextResponse.json(
        { success: false, message: 'Invalid tracking token' },
        { status: 404 }
      )
    }

    // Save labels
    if (Array.isArray(allCreatedLabels)) {
      // Delete existing labels
      await supabase
        .from('tracking_link_labels')
        .delete()
        .eq('token', token)

      // Insert new labels with order
      if (allCreatedLabels.length > 0) {
        const labelsToInsert = allCreatedLabels.map((label: string, index: number) => {
          // Find the order for this label if labelOrder is provided
          let order = index
          if (Array.isArray(labelOrder)) {
            const orderIndex = labelOrder.indexOf(label)
            if (orderIndex !== -1) {
              order = orderIndex
            }
          }
          return {
            token,
            label_name: label,
            label_order: order,
          }
        })

        const { error: insertError } = await supabase
          .from('tracking_link_labels')
          .insert(labelsToInsert)

        if (insertError) {
          console.error('Error inserting labels:', insertError)
        }
      }
    }

    // Save order-label associations
    if (orderLabels && typeof orderLabels === 'object') {
      // Delete existing order labels
      await supabase
        .from('tracking_link_order_labels')
        .delete()
        .eq('token', token)

      // Insert new order labels
      const orderLabelsToInsert: Array<{ token: string; order_id: string; label_name: string }> = []
      Object.entries(orderLabels).forEach(([orderId, labels]) => {
        if (Array.isArray(labels)) {
          labels.forEach((label: string) => {
            orderLabelsToInsert.push({
              token,
              order_id: orderId,
              label_name: label,
            })
          })
        }
      })

      if (orderLabelsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('tracking_link_order_labels')
          .insert(orderLabelsToInsert)

        if (insertError) {
          console.error('Error inserting order labels:', insertError)
        }
      }
    }

    // Save label emails
    if (labelEmails && typeof labelEmails === 'object') {
      // Delete existing label emails
      await supabase
        .from('tracking_link_label_emails')
        .delete()
        .eq('token', token)

      // Insert new label emails
      const labelEmailsToInsert: Array<{ token: string; label_name: string; email: string }> = []
      Object.entries(labelEmails).forEach(([labelName, emails]) => {
        if (Array.isArray(emails)) {
          emails.forEach((email: string) => {
            if (email && email.trim()) {
              labelEmailsToInsert.push({
                token,
                label_name: labelName,
                email: email.trim(),
              })
            }
          })
        }
      })

      if (labelEmailsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('tracking_link_label_emails')
          .insert(labelEmailsToInsert)

        if (insertError) {
          console.error('Error inserting label emails:', insertError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Labels saved successfully',
    })
  } catch (error: any) {
    console.error('Error in POST /api/track/[token]/labels:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to save labels',
      },
      { status: 500 }
    )
  }
}

