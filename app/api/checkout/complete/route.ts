import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, isCollector } from '@/lib/rbac'
import { shopifyFetch } from '@/lib/shopify-api'

/**
 * POST /api/checkout/complete
 * 
 * Completes a credit-only checkout by:
 * 1. Deducting credits from collector account
 * 2. Creating Shopify draft order
 * 3. Marking checkout session as completed
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const ctx = await getUserContext(supabase)

    // Parse request body
    const body = await request.json()
    const { sessionId, shippingAddress, billingAddress } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    // Get checkout session
    const { data: checkoutSession, error: sessionError } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (sessionError || !checkoutSession) {
      return NextResponse.json(
        { error: 'Checkout session not found' },
        { status: 404 }
      )
    }

    // Validate session status
    if (checkoutSession.status !== 'pending') {
      return NextResponse.json(
        { error: `Session already ${checkoutSession.status}` },
        { status: 400 }
      )
    }

    // For credit-only purchases, require authentication
    if (checkoutSession.stripe_charge_cents === 0) {
      if (!ctx || !isCollector(ctx)) {
        return NextResponse.json(
          { error: 'Authentication required for credit purchases' },
          { status: 401 }
        )
      }

      // Verify the session belongs to this user
      if (checkoutSession.collector_identifier !== ctx.email) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }
    }

    const creditsToDeduct = checkoutSession.credits_used || 0
    const collectorIdentifier = checkoutSession.collector_identifier

    // Get collector record
    const { data: collector } = await supabase
      .from('collectors')
      .select('id')
      .eq('email', collectorIdentifier)
      .maybeSingle()

    if (!collector && creditsToDeduct > 0) {
      return NextResponse.json(
        { error: 'Collector not found' },
        { status: 404 }
      )
    }

    // Verify sufficient credits
    if (creditsToDeduct > 0 && collector) {
      const { data: account } = await supabase
        .from('collector_accounts')
        .select('credits_balance')
        .eq('collector_id', collector.id)
        .maybeSingle()

      const availableCredits = account?.credits_balance || 0

      if (availableCredits < creditsToDeduct) {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 400 }
        )
      }

      // Deduct credits
      await supabase
        .from('collector_accounts')
        .update({ 
          credits_balance: availableCredits - creditsToDeduct,
          updated_at: new Date().toISOString(),
        })
        .eq('collector_id', collector.id)

      // Record credit redemption in ledger
      await supabase.from('collector_ledger_entries').insert({
        collector_identifier: collectorIdentifier,
        transaction_type: 'redemption',
        credits_amount: -creditsToDeduct,
        usd_amount: -(creditsToDeduct * 0.10), // $0.10 per credit
        description: `Purchase: ${checkoutSession.line_items?.length || 0} item(s)`,
        credit_source: 'purchase',
        reference_type: 'checkout',
        reference_id: sessionId,
      })
    }

    // Create Shopify draft order
    const lineItems = checkoutSession.line_items as Array<{
      variantId: string
      quantity: number
      title: string
    }>

    const draftOrderData = {
      draft_order: {
        line_items: lineItems.map(item => ({
          variant_id: parseInt(item.variantId),
          quantity: item.quantity,
        })),
        customer: collectorIdentifier ? {
          email: collectorIdentifier,
        } : undefined,
        shipping_address: shippingAddress ? {
          first_name: shippingAddress.firstName || '',
          last_name: shippingAddress.lastName || '',
          address1: shippingAddress.address1 || '',
          address2: shippingAddress.address2 || '',
          city: shippingAddress.city || '',
          province: shippingAddress.province || '',
          country: shippingAddress.country || '',
          zip: shippingAddress.zip || '',
          phone: shippingAddress.phone || '',
        } : undefined,
        billing_address: billingAddress ? {
          first_name: billingAddress.firstName || '',
          last_name: billingAddress.lastName || '',
          address1: billingAddress.address1 || '',
          address2: billingAddress.address2 || '',
          city: billingAddress.city || '',
          province: billingAddress.province || '',
          country: billingAddress.country || '',
          zip: billingAddress.zip || '',
        } : undefined,
        email: collectorIdentifier || '',
        note: `Credit Purchase\nSession ID: ${sessionId}\nCredits Used: ${creditsToDeduct}\nSource: Headless Storefront`,
        tags: 'headless,credit-purchase',
        use_customer_default_address: false,
      },
    }

    // Create the draft order in Shopify
    const response = await shopifyFetch('draft_orders.json', {
      method: 'POST',
      body: JSON.stringify(draftOrderData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[checkout/complete] Shopify draft order error:', errorText)
      
      // Refund credits if Shopify order fails
      if (creditsToDeduct > 0 && collector) {
        await supabase.rpc('increment_collector_credits', {
          p_collector_identifier: collectorIdentifier,
          p_amount: creditsToDeduct,
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    const { draft_order } = await response.json()

    // Complete the draft order (mark as paid)
    const completeResponse = await shopifyFetch(`draft_orders/${draft_order.id}/complete.json`, {
      method: 'PUT',
      body: JSON.stringify({
        payment_pending: false,
      }),
    })

    let shopifyOrderId: string | null = null

    if (completeResponse.ok) {
      const { draft_order: completedOrder } = await completeResponse.json()
      shopifyOrderId = completedOrder.order_id?.toString() || null
    }

    // Mark checkout session as completed
    await supabase
      .from('checkout_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: {
          ...checkoutSession.metadata,
          shopify_draft_order_id: draft_order.id.toString(),
          shopify_order_id: shopifyOrderId,
        },
      })
      .eq('session_id', sessionId)

    return NextResponse.json({
      success: true,
      orderId: shopifyOrderId,
      draftOrderId: draft_order.id.toString(),
      creditsUsed: creditsToDeduct,
      message: 'Order completed successfully',
    })
  } catch (error) {
    console.error('[checkout/complete] Error:', error)
    return NextResponse.json(
      { error: 'Failed to complete checkout' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/checkout/complete
 * 
 * Used for credit-only checkout redirect - shows completion page.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.redirect(new URL('/shop/cart', request.url))
  }

  const supabase = createClient()
  const ctx = await getUserContext(supabase)

  if (!ctx || !isCollector(ctx)) {
    return NextResponse.redirect(new URL('/auth/login?returnTo=/shop/cart', request.url))
  }

  // Redirect to checkout success page for credit-only completions
  return NextResponse.redirect(
    new URL(`/shop/checkout/success?session_id=${sessionId}&credit_only=true`, request.url)
  )
}
