import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createChinaDivisionClient } from '@/lib/chinadivision/client'
import { sendTrackingUpdateEmail, type TrackingEmailOrder } from '@/lib/notifications/tracking-link'
import { createFulfillmentWithTracking } from '@/lib/shopify/fulfillment'

const CRON_SECRET = process.env.CRON_SECRET

const APPROVING_STATUS = 0
const IN_TRANSIT_TRACK_STATUS = 101

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-cron-secret')
    const { searchParams } = new URL(request.url)
    const dryRun = searchParams.get('dryRun') === 'true'

    if (!CRON_SECRET || secret !== CRON_SECRET) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const chinaClient = createChinaDivisionClient()

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    const startStr = startDate.toISOString().split('T')[0]
    const endStr = endDate.toISOString().split('T')[0]

    const orders = await chinaClient.getOrdersInfo(startStr, endStr, true)

    const eligible = (orders || []).filter((order) => {
      const hasTracking = !!order.tracking_number
      const inTransit = typeof order.track_status === 'number' && order.track_status >= IN_TRANSIT_TRACK_STATUS
      const shipped = order.status === 3
      return hasTracking && (inTransit || shipped)
    })

    const results: Array<{ orderId: string; status: string; detail?: string }> = []
    let linksCreated = 0
    let emailsSent = 0
    let fulfillmentsCreated = 0
    let skipped = 0

    for (const order of eligible) {
      const orderId = order.order_id || order.sys_order_id || ''
      if (!orderId) {
        skipped++
        results.push({ orderId: 'unknown', status: 'skipped', detail: 'missing order_id' })
        continue
      }

      try {
        // Find existing tracking link
        const { data: existingLink } = await supabase
          .from('shared_order_tracking_links')
          .select('*')
          .contains('order_ids', [order.order_id])
          .maybeSingle()

        let trackingLink = existingLink

        if (!trackingLink && !dryRun) {
          const token = crypto.randomBytes(32).toString('hex')
          const { data: newLink, error: linkError } = await supabase
            .from('shared_order_tracking_links')
            .insert({
              token,
              order_ids: [order.order_id],
              title: `Shipment for ${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Shipment',
              created_by: 'system@chinadivision-auto',
              primary_color: '#8217ff',
            })
            .select()
            .single()

          if (linkError) {
            throw linkError
          }
          trackingLink = newLink
          linksCreated++
        }

        if (!trackingLink) {
          skipped++
          results.push({ orderId, status: 'skipped', detail: 'dryRun_no_link' })
          continue
        }

        // Upsert notification preferences
        if (!dryRun) {
          await supabase
            .from('tracking_link_notification_preferences')
            .upsert({
              token: trackingLink.token,
              email_enabled: true,
              notification_email: order.ship_email,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'token' })
        }

        const emailOrders: TrackingEmailOrder[] = [
          {
            orderId: order.order_id,
            sysOrderId: order.sys_order_id,
            recipientName: `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Customer',
            status: order.status,
            statusName: order.status_name,
            trackStatus: order.track_status,
            trackStatusName: order.track_status_name,
            trackingNumber: order.tracking_number,
            shipCountry: order.ship_country,
          },
        ]

        if (!dryRun && order.ship_email) {
          const emailResult = await sendTrackingUpdateEmail({
            token: trackingLink.token,
            title: trackingLink.title || 'Order Tracking',
            orders: emailOrders,
            primaryColor: trackingLink.primary_color || '#8217ff',
            email: order.ship_email,
            baseUrl: process.env.NEXT_PUBLIC_APP_URL,
          })
          if (!emailResult.success) {
            throw new Error(emailResult.error || 'Failed to send email')
          }
          emailsSent++

          // Update last_notified_status
          const orderKey = order.order_id || order.sys_order_id
          const { data: prefs } = await supabase
            .from('tracking_link_notification_preferences')
            .select('last_notified_status')
            .eq('token', trackingLink.token)
            .maybeSingle()

          const lastNotified = (prefs?.last_notified_status as Record<string, any>) || {}
          if (orderKey) {
            lastNotified[orderKey] = {
              status: order.status,
              track_status: order.track_status,
            }
          }

          await supabase
            .from('tracking_link_notification_preferences')
            .update({
              last_notified_status: lastNotified,
              updated_at: new Date().toISOString(),
            })
            .eq('token', trackingLink.token)
        }

        // Create Shopify fulfillment
        if (!dryRun) {
          try {
            await createFulfillmentWithTracking({
              orderId: order.order_id,
              trackingNumber: order.tracking_number!,
              trackingUrl: order.last_mile_tracking || order.tracking_number || undefined,
              trackingCompany: order.carrier || 'ChinaDivision',
            })
            fulfillmentsCreated++
          } catch (fulfillmentError: any) {
            results.push({ orderId, status: 'partial', detail: `fulfillment_error:${fulfillmentError.message || fulfillmentError}` })
          }
        }

        // Update Supabase order + line items
        if (!dryRun) {
          const updatedAt = new Date().toISOString()
          await supabase
            .from('orders')
            .update({
              fulfillment_status: 'fulfilled',
              updated_at: updatedAt,
            })
            .eq('id', order.order_id.toString())

          await supabase
            .from('order_line_items')
            .update({
              fulfillment_status: 'fulfilled',
              tracking_number: order.tracking_number,
              tracking_url: order.last_mile_tracking || order.tracking_number || null,
              tracking_company: order.carrier || 'ChinaDivision',
              updated_at: updatedAt,
            })
            .eq('order_id', order.order_id.toString())
        }

        results.push({ orderId, status: dryRun ? 'dry-run' : 'processed' })
      } catch (error: any) {
        results.push({ orderId, status: 'error', detail: error.message || 'unknown error' })
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      window: { start: startStr, end: endStr },
      totalFetched: orders.length,
      eligible: eligible.length,
      linksCreated,
      emailsSent,
      fulfillmentsCreated,
      skipped,
      results,
    })
  } catch (error: any) {
    console.error('[auto-fulfill] error', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal error' },
      { status: 500 },
    )
  }
}

