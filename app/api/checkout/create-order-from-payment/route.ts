import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { createAndCompleteOrder } from '@/lib/stripe/fulfill-embedded-payment'
import { capturePostHogServerEvent } from '@/lib/posthog-server'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-03-31.basil' }) : null
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function resolvePaymentIntentPhone(paymentIntent: Stripe.PaymentIntent): Promise<string | null> {
  if (paymentIntent.shipping?.phone) {
    return paymentIntent.shipping.phone
  }

  const paymentMethodObj =
    typeof paymentIntent.payment_method === 'object' && paymentIntent.payment_method
      ? paymentIntent.payment_method
      : null
  if (paymentMethodObj && 'billing_details' in paymentMethodObj && paymentMethodObj.billing_details?.phone) {
    return paymentMethodObj.billing_details.phone
  }

  if (typeof paymentIntent.payment_method === 'string') {
    try {
      const paymentMethod = await stripe!.paymentMethods.retrieve(paymentIntent.payment_method)
      if (paymentMethod.billing_details?.phone) return paymentMethod.billing_details.phone
    } catch (error) {
      console.warn('[checkout/create-order-from-payment] Could not retrieve payment method for phone fallback:', error)
    }
  }

  const latestChargeId =
    typeof paymentIntent.latest_charge === 'string'
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge?.id
  if (latestChargeId) {
    try {
      const charge = await stripe!.charges.retrieve(latestChargeId)
      if (charge.billing_details?.phone) return charge.billing_details.phone
    } catch (error) {
      console.warn('[checkout/create-order-from-payment] Could not retrieve latest charge for phone fallback:', error)
    }
  }

  return null
}

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

    const phoneFromPayment = await resolvePaymentIntentPhone(pi)
    const address = {
      ...shipping_address,
      phoneNumber: shipping_address.phoneNumber || phoneFromPayment || undefined,
    }
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

    const purchaserEmail = (metadata.collector_identifier || shipping_address.email || '').toLowerCase().trim()
    if (purchaserEmail) {
      const posthogResult = await capturePostHogServerEvent('purchase', purchaserEmail, {
        value: (pi.amount_received || 0) / 100,
        currency: (pi.currency || 'usd').toUpperCase(),
        transaction_id: pi.id,
        source: 'stripe_embedded_create_order_from_payment',
        $set: { has_purchased: true },
      })
      if (!posthogResult.success) {
        console.warn('[checkout/create-order-from-payment] PostHog purchase tracking failed:', posthogResult.error)
      }
    }

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
