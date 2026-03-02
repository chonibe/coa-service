import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { createAndCompleteOrder } from '@/lib/stripe/fulfill-embedded-payment'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' }) : null
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface ShippingAddressInput {
  email?: string
  fullName?: string
  country?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  phoneNumber?: string
}

interface CartLineItem {
  productId: string
  variantId: string
  variantGid: string
  handle: string
  title: string
  price: number
  quantity: number
}

interface CompleteOrderRequest {
  paymentIntentId: string
  items: CartLineItem[]
  shippingAddress: ShippingAddressInput
}

/**
 * POST /api/checkout/complete-order
 *
 * Called after a successful inline payment (card/GPay/Link) to create
 * the Shopify order and record the purchase. For PayPal redirects,
 * the success page calls this endpoint after verifying the payment.
 */
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
  }

  try {
    const body: CompleteOrderRequest = await request.json()
    const { paymentIntentId, items, shippingAddress } = body

    if (!paymentIntentId || !items?.length || !shippingAddress?.email) {
      return NextResponse.json(
        { error: 'Missing paymentIntentId, items, or shipping address' },
        { status: 400 }
      )
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: `Payment not completed. Status: ${paymentIntent.status}` },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data: existingPurchase } = await supabase
      .from('stripe_purchases')
      .select('id')
      .eq('stripe_payment_intent', paymentIntentId)
      .maybeSingle()

    if (existingPurchase) {
      return NextResponse.json({
        success: true,
        alreadyFulfilled: true,
        redirectUrl: `${baseUrl}/shop/checkout/success?payment_intent=${paymentIntentId}`,
      })
    }

    const variants = items.map((i) => ({
      variantId: i.variantId,
      quantity: i.quantity,
      productHandle: i.handle,
    }))

    const totalCents = items.reduce(
      (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
      0
    )

    const { draftOrderId, orderId } = await createAndCompleteOrder(
      variants,
      shippingAddress,
      paymentIntentId,
      totalCents,
      'usd'
    )

    await supabase.from('stripe_purchases').insert({
      stripe_session_id: `pi_embedded_${paymentIntentId}`,
      stripe_payment_intent: paymentIntentId,
      shopify_draft_order_id: draftOrderId,
      shopify_order_id: orderId || null,
      customer_email: shippingAddress.email || null,
      amount_total: totalCents,
      currency: 'usd',
      status: 'completed',
      metadata: paymentIntent.metadata,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      redirectUrl: `${baseUrl}/shop/checkout/success?payment_intent=${paymentIntentId}`,
      orderId,
      draftOrderId,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Order creation failed'
    console.error('[checkout/complete-order] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
