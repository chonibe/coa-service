import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createRouteClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@/lib/supabase/server'
import { mockAccountOrders } from '@/lib/mock-data'

const MOCK_COOKIE = 'mock_user_email'

/**
 * Shop Account Orders API
 *
 * Returns order history for the authenticated customer from the orders table
 * (Shopify-synced data). Matches by customer_email.
 * In development, supports mock orders via mock_user_email cookie (streets@streets.com).
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

    const result = orders.map((order) => {
      const raw = order.raw_shopify_order_data as Record<string, unknown> | null
      const shipping = raw?.shipping_address as Record<string, string> | undefined
      const fulfillments = (raw?.fulfillments as Array<{ tracking_number?: string; tracking_urls?: { url?: string }[] }>) || []
      const trackingNum = fulfillments[0]?.tracking_number
      const trackingUrl = fulfillments[0]?.tracking_urls?.[0]?.url

      return {
        id: order.id,
        shopifyOrderId: order.shopify_id || order.id,
        orderNumber: order.order_number || order.order_name?.replace('#', '') || order.id.slice(-6),
        createdAt: order.processed_at || order.created_at,
        status: mapFulfillmentStatus(order.fulfillment_status, order.financial_status),
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
        trackingNumber: trackingNum,
        trackingUrl: trackingUrl || (trackingNum ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNum}` : undefined),
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
): 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' {
  const f = fulfillment?.toLowerCase()
  const fin = financial?.toLowerCase()

  if (fin === 'refunded' || fin === 'voided') return 'refunded'
  if (f === 'fulfilled' || f === 'shipped') return 'shipped'
  if (f === 'delivered') return 'delivered'
  if (f === 'cancelled' || f === 'restocked') return 'cancelled'
  if (f === 'partial' || fin === 'paid') return 'processing'
  return 'pending'
}
