import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { createAndCompleteOrder } from '@/lib/stripe/fulfill-embedded-payment'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' }) : null
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * POST /api/checkout/create-order-from-payment
 *
 * Creates the Shopify order after 3DS authentication. Call this after
 * stripe.handleCardAction(client_secret) resolves successfully.
 */
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { payment_intent_id, shipping_address } = body

    if (!payment_intent_id) {
      return NextResponse.json({ error: 'payment_intent_id required' }, { status: 400 })
    }
    if (!shipping_address?.email) {
      return NextResponse.json({ error: 'shipping_address required (with email)' }, { status: 400 })
    }

    const pi = await stripe.paymentIntents.retrieve(payment_intent_id)
    if (pi.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not yet complete' }, { status: 400 })
    }

    const metadata = pi.metadata || {}
    if (metadata.source !== 'headless_storefront_embedded' || !metadata.shopify_variant_ids) {
      return NextResponse.json({ error: 'Invalid payment intent' }, { status: 400 })
    }

    const variants = metadata.shopify_variant_ids.split(',').map((part: string) => {
      const [variantId, qty] = part.split(':')
      return { variantId: variantId ?? '', quantity: parseInt(qty ?? '1', 10), productHandle: '' }
    }).filter((v: { variantId: string }) => v.variantId)

    const address = shipping_address
    const affiliateVendorId = metadata.affiliate_vendor_id ? parseInt(metadata.affiliate_vendor_id, 10) : undefined

    const { draftOrderId, orderId } = await createAndCompleteOrder(
      variants,
      address,
      pi.id,
      pi.amount_received || 0,
      pi.currency || 'usd',
      affiliateVendorId
    )

    const supabase = createClient()
    await supabase.from('stripe_purchases').insert({
      stripe_session_id: `pi_${pi.id}`,
      stripe_payment_intent: pi.id,
      shopify_draft_order_id: draftOrderId,
      shopify_order_id: orderId,
      customer_email: metadata.collector_identifier || null,
      amount_total: pi.amount_received || 0,
      currency: pi.currency || 'usd',
      status: 'completed',
      metadata: Object.fromEntries(Object.entries(metadata)),
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      redirectUrl: `${baseUrl}/shop/checkout/success?payment_intent=${pi.id}`,
    })
  } catch (err: unknown) {
    console.error('[checkout/create-order-from-payment] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Order creation failed' },
      { status: 500 }
    )
  }
}
