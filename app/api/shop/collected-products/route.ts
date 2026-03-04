import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createRouteClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@/lib/supabase/server'

/**
 * Shop Collected Products API
 *
 * Returns product IDs the authenticated user already owns (from orders).
 * Used by experience configurator to show "collected" badge in artwork selector.
 * IDs are returned in both GID and numeric form for matching against Storefront API.
 */

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteClient(cookieStore)

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user?.email) {
      return NextResponse.json({ productIds: [] })
    }

    const email = session.user.email.trim().toLowerCase()
    const serviceClient = createServiceClient()

    const { data: orders, error: ordersError } = await serviceClient
      .from('orders')
      .select('id')
      .ilike('customer_email', email)
      .is('cancelled_at', null)
      .neq('fulfillment_status', 'canceled')
      .neq('financial_status', 'voided')
      .limit(100)

    if (ordersError || !orders?.length) {
      return NextResponse.json({ productIds: [] })
    }

    const orderIds = orders.map((o) => o.id)

    const { data: lineItems, error: lineItemsError } = await serviceClient
      .from('order_line_items_v2')
      .select('product_id')
      .in('order_id', orderIds)
      .eq('status', 'active')

    if (lineItemsError || !lineItems?.length) {
      return NextResponse.json({ productIds: [] })
    }

    // Normalize: Storefront uses gid://shopify/Product/123, DB may store numeric
    const productIds = Array.from(
      new Set(
        (lineItems || [])
          .map((li) => li.product_id?.toString().trim())
          .filter(Boolean) as string[]
      )
    )

    // Return both numeric IDs and GIDs for flexible matching
    const numericIds = productIds.map((id) => {
      const n = id.replace(/^gid:\/\/shopify\/Product\//i, '')
      return n || id
    })
    const gidIds = numericIds.map((n) => (n.match(/^\d+$/) ? `gid://shopify/Product/${n}` : n))

    return NextResponse.json({
      productIds: [...new Set([...numericIds, ...gidIds])],
    })
  } catch (error) {
    console.error('[collected-products] Error:', error)
    return NextResponse.json({ productIds: [] })
  }
}
