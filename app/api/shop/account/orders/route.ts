import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Shop Account Orders API
 * 
 * Returns order history for the authenticated customer.
 */

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get collector ID
    const { data: collector, error: collectorError } = await supabase
      .from('collectors')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (collectorError) {
      // No collector record - return empty orders
      return NextResponse.json({ orders: [] })
    }

    // Get orders from stripe_purchases table
    const { data: purchases, error: purchasesError } = await supabase
      .from('stripe_purchases')
      .select('*')
      .eq('customer_email', session.user.email)
      .order('created_at', { ascending: false })

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError)
      return NextResponse.json({ orders: [] })
    }

    // Also get line_items for the collector
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('line_items')
      .select(`
        id,
        shopify_line_item_id,
        shopify_order_id,
        shopify_order_number,
        product_title,
        variant_title,
        quantity,
        price,
        order_date,
        fulfillment_status,
        tracking_number,
        tracking_url,
        products (
          product_name,
          product_image
        )
      `)
      .eq('collector_id', collector.id)
      .order('order_date', { ascending: false })

    if (lineItemsError) {
      console.error('Error fetching line items:', lineItemsError)
    }

    // Group line items by order
    const orderMap = new Map<string, any>()
    
    for (const item of (lineItems || [])) {
      const orderId = item.shopify_order_id
      if (!orderId) continue

      if (!orderMap.has(orderId)) {
        orderMap.set(orderId, {
          id: orderId,
          shopifyOrderId: orderId,
          orderNumber: item.shopify_order_number || orderId.slice(-6),
          createdAt: item.order_date,
          status: mapFulfillmentStatus(item.fulfillment_status),
          totalAmount: 0,
          currency: 'USD',
          lineItems: [],
          trackingNumber: item.tracking_number || undefined,
          trackingUrl: item.tracking_url || undefined,
        })
      }

      const order = orderMap.get(orderId)
      const price = parseFloat(item.price || '0') * 100 // Convert to cents
      
      order.lineItems.push({
        id: item.id,
        title: item.product_title || item.products?.product_name || 'Artwork',
        variantTitle: item.variant_title,
        quantity: item.quantity || 1,
        price: price,
        imageUrl: item.products?.product_image,
      })
      
      order.totalAmount += price * (item.quantity || 1)
    }

    // Add any purchases from stripe_purchases that aren't in line_items
    for (const purchase of (purchases || [])) {
      const orderId = purchase.shopify_order_id
      if (orderId && !orderMap.has(orderId)) {
        orderMap.set(purchase.stripe_session_id, {
          id: purchase.stripe_session_id,
          shopifyOrderId: orderId || null,
          orderNumber: orderId?.slice(-6) || purchase.stripe_session_id.slice(-8).toUpperCase(),
          createdAt: purchase.created_at,
          status: purchase.status === 'completed' ? 'processing' : 'pending',
          totalAmount: purchase.amount_total || 0,
          currency: purchase.currency?.toUpperCase() || 'USD',
          lineItems: [],
        })
      }
    }

    const orders = Array.from(orderMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ orders })
  } catch (error: any) {
    console.error('Orders fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

/**
 * Map Shopify fulfillment status to our status type
 */
function mapFulfillmentStatus(status: string | null): string {
  switch (status?.toLowerCase()) {
    case 'fulfilled':
    case 'shipped':
      return 'shipped'
    case 'delivered':
      return 'delivered'
    case 'cancelled':
    case 'refunded':
      return 'cancelled'
    case 'pending':
    case 'unfulfilled':
    case null:
    default:
      return 'processing'
  }
}
