import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createRouteClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@/lib/supabase/server'
import { mockAccountOrders } from '@/lib/mock-data'
import { getTrackStatusLabel, getStatusLabel } from '@/lib/notifications/tracking-link'

const MOCK_COOKIE = 'mock_user_email'

/** Normalize order identifier for matching (strip #, trim) */
function normalizeOrderId(val: string | null | undefined): string {
  if (!val) return ''
  return String(val).replace(/^#/, '').trim().toLowerCase()
}

/**
 * Shop Account Orders API
 *
 * Returns order history for the authenticated customer from the orders table
 * (Shopify-synced data). Enriched with warehouse status when available.
 * Matches by customer_email. In development, supports mock orders via mock_user_email cookie.
 */

export async function GET() {
  try {
    const cookieStore = cookies()
    const mockEmail = cookieStore.get(MOCK_COOKIE)?.value
    const isDev = process.env.NODE_ENV === 'development'
    const mockEnabled = process.env.MOCK_LOGIN_ENABLED === 'true'

    if (mockEmail && (isDev || mockEnabled)) {
      return NextResponse.json({ orders: mockAccountOrders })
    }

    const supabase = createRouteClient(cookieStore)

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const email = session.user.email.trim().toLowerCase()

    const serviceClient = createServiceClient()

    const { data: orders, error: ordersError } = await serviceClient
      .from('orders')
      .select(`
        id,
        shopify_id,
        order_number,
        order_name,
        processed_at,
        created_at,
        total_price,
        currency_code,
        financial_status,
        fulfillment_status,
        customer_email,
        raw_shopify_order_data
      `)
      .ilike('customer_email', email)
      .is('cancelled_at', null)
      .order('processed_at', { ascending: false })
      .limit(50)

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json({ orders: [] })
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ orders: [] })
    }

    const orderIds = orders.map((o) => o.id)

    const { data: lineItems, error: lineItemsError } = await serviceClient
      .from('order_line_items_v2')
      .select(`
        id,
        order_id,
        name,
        quantity,
        price,
        img_url,
        fulfillment_status,
        status
      `)
      .in('order_id', orderIds)
      .order('created_at', { ascending: true })

    if (lineItemsError) {
      console.error('Error fetching line items:', lineItemsError)
    }

    const lineItemsByOrder = new Map<string, typeof lineItems>()
    for (const item of lineItems || []) {
      const list = lineItemsByOrder.get(item.order_id) || []
      list.push(item)
      lineItemsByOrder.set(item.order_id, list)
    }

    // Fetch warehouse order data for enrichment (status, tracking)
    const { data: warehouseRows } = await serviceClient
      .from('warehouse_orders')
      .select('order_id, shopify_order_id, tracking_number, status, status_name, raw_data')
      .ilike('ship_email', email)

    const warehouseByOrder = new Map<string, (typeof warehouseRows)[0]>()
    for (const wo of warehouseRows || []) {
      if (wo.shopify_order_id) {
        warehouseByOrder.set(wo.shopify_order_id.toString(), wo)
      }
      const norm = normalizeOrderId(wo.order_id)
      if (norm) {
        warehouseByOrder.set(norm, wo)
      }
    }

    const result = orders.map((order) => {
      const raw = order.raw_shopify_order_data as Record<string, unknown> | null
      const shipping = raw?.shipping_address as Record<string, string> | undefined
      const billing = raw?.billing_address as Record<string, string> | undefined
      const fulfillments = (raw?.fulfillments as Array<{ tracking_number?: string; tracking_urls?: { url?: string }[] }>) || []
      let trackingNum = fulfillments[0]?.tracking_number
      let trackingUrl = fulfillments[0]?.tracking_urls?.[0]?.url

      const wo =
        warehouseByOrder.get(order.id) ||
        warehouseByOrder.get(normalizeOrderId(order.order_name)) ||
        warehouseByOrder.get(normalizeOrderId(order.order_number))
      let shopifyStatus = mapFulfillmentStatus(order.fulfillment_status, order.financial_status)
      let warehouseStatusLabel: string | undefined

      if (wo) {
        const rawData = (wo.raw_data as { track_status?: number; track_status_name?: string; last_mile_tracking?: string }) || {}
        const trackStatus = rawData.track_status
        const trackStatusName = rawData.track_status_name
        if (!trackingNum && wo.tracking_number) {
          trackingNum = wo.tracking_number
          trackingUrl = rawData.last_mile_tracking || (trackingNum ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNum}` : trackingUrl)
        }
        warehouseStatusLabel = getTrackStatusLabel(trackStatus, trackStatusName) || getStatusLabel(wo.status, wo.status_name)
        const warehouseStatus = mapWarehouseToOrderStatus(trackStatus, wo.status)
        if (warehouseStatus) {
          shopifyStatus = warehouseStatus
        }
      }

      return {
        id: order.id,
        shopifyOrderId: order.shopify_id || order.id,
        orderNumber: order.order_number || order.order_name?.replace('#', '') || order.id.slice(-6),
        createdAt: order.processed_at || order.created_at,
        status: shopifyStatus,
        totalAmount: Math.round((order.total_price || 0) * 100),
        currency: order.currency_code || 'USD',
        lineItems: (lineItemsByOrder.get(order.id) || []).map((li) => ({
          id: li.id,
          title: li.name || 'Artwork',
          variantTitle: undefined,
          quantity: li.quantity || 1,
          price: Math.round((parseFloat(String(li.price || 0)) || 0) * 100),
          imageUrl: li.img_url,
        })),
        shippingAddress: shipping
          ? {
              name: [shipping.first_name, shipping.last_name].filter(Boolean).join(' '),
              address1: shipping.address1,
              address2: shipping.address2,
              city: shipping.city,
              province: shipping.province || shipping.province_code,
              postalCode: shipping.zip,
              country: shipping.country,
            }
          : undefined,
        billingAddress: billing
          ? {
              name: [billing.first_name, billing.last_name].filter(Boolean).join(' '),
              address1: billing.address1,
              address2: billing.address2,
              city: billing.city,
              province: billing.province || billing.province_code,
              postalCode: billing.zip,
              country: billing.country,
            }
          : undefined,
        trackingNumber: trackingNum,
        trackingUrl: trackingUrl || (trackingNum ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNum}` : undefined),
        warehouseStatusLabel: warehouseStatusLabel,
      }
    })

    return NextResponse.json({ orders: result })
  } catch (error: unknown) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

function mapFulfillmentStatus(
  fulfillment: string | null,
  financial: string | null
): 'pending' | 'processing' | 'shipped' | 'delivered' | 'out_for_delivery' | 'cancelled' | 'refunded' {
  const f = fulfillment?.toLowerCase()
  const fin = financial?.toLowerCase()

  if (fin === 'refunded' || fin === 'voided') return 'refunded'
  if (f === 'fulfilled' || f === 'shipped') return 'shipped'
  if (f === 'delivered') return 'delivered'
  if (f === 'cancelled' || f === 'restocked') return 'cancelled'
  if (f === 'partial' || fin === 'paid') return 'processing'
  return 'pending'
}

/** Map warehouse track_status / status to order display status */
function mapWarehouseToOrderStatus(
  trackStatus?: number,
  warehouseStatus?: number
): 'shipped' | 'delivered' | 'out_for_delivery' | null {
  if (trackStatus === 121) return 'delivered'
  if (trackStatus === 112) return 'out_for_delivery'
  if (trackStatus === 111 || trackStatus === 101 || trackStatus === 131 || trackStatus === 132) return 'shipped'
  if (warehouseStatus === 3) return 'shipped'
  return null
}
