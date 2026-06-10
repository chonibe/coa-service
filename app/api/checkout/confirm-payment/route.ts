import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { createAndCompleteOrder } from '@/lib/stripe/fulfill-embedded-payment'
import { resolveRefToVendorId, AFFILIATE_REF_COOKIE } from '@/lib/affiliate'
import { capturePostHogServerEvent } from '@/lib/posthog-server'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-05-28.basil' }) : null
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface CartLineItem {
  productId: string
  variantId: string
  variantGid: string
  handle: string
  title: string
  price: number
  quantity: number
}

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

interface ConfirmPaymentRequest {
  items: CartLineItem[]
  paymentMethodId: string
  shippingAddress: ShippingAddressInput
}

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
      console.warn('[checkout/confirm-payment] Could not retrieve payment method for phone fallback:', error)
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
      console.warn('[checkout/confirm-payment] Could not retrieve latest charge for phone fallback:', error)
    }
  }

  return null
}

/**
 * POST /api/checkout/confirm-payment
 *
 * Confirms a PaymentIntent with a saved card. Used for embedded card/Link flow.
 */
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
  }

  try {
    const supabase = createClient()
    const cookieStore = await cookies()
    const affiliateRef = cookieStore.get(AFFILIATE_REF_COOKIE)?.value
    const affiliateVendorId = await resolveRefToVendorId(affiliateRef, supabase)
    const metaFbp = cookieStore.get('_fbp')?.value
    const metaFbc = cookieStore.get('_fbc')?.value || cookieStore.get('sc_fbc')?.value
    const metaFbclid = cookieStore.get('sc_fbclid')?.value

    const body: ConfirmPaymentRequest = await request.json()
    const { items, paymentMethodId, shippingAddress } = body

    if (!items?.length || !paymentMethodId || !shippingAddress?.email) {
      return NextResponse.json({ error: 'Missing items, paymentMethodId, or shipping address' }, { status: 400 })
    }

    const subtotalCents = items.reduce(
      (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
      0
    )

    const shopifyVariantsCompact = items
      .map((i) => `${i.variantId}:${i.quantity}`)
      .join(',')

    const paymentIntent = await stripe.paymentIntents.create({
      amount: subtotalCents,
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: { enabled: false },
      payment_method_types: ['card', 'link'],
      metadata: {
        source: 'headless_storefront_embedded',
        shopify_variant_ids: shopifyVariantsCompact,
        collector_identifier: shippingAddress.email || '',
        ...(metaFbp && { meta_fbp: metaFbp }),
        ...(metaFbc && { meta_fbc: metaFbc }),
        ...(metaFbclid && { meta_fbclid: metaFbclid }),
        ...(affiliateVendorId && { affiliate_vendor_id: affiliateVendorId.toString() }),
      },
      return_url: `${baseUrl}/shop/checkout/success`,
    })

    if (paymentIntent.status === 'succeeded') {
      const phoneFromPayment = await resolvePaymentIntentPhone(paymentIntent)
      const shippingWithPhone: ShippingAddressInput = {
        ...shippingAddress,
        phoneNumber: shippingAddress.phoneNumber || phoneFromPayment || undefined,
      }

      const variants = items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        productHandle: i.handle,
      }))
      const { draftOrderId, orderId } = await createAndCompleteOrder(
        variants,
        shippingWithPhone,
        paymentIntent.id,
        subtotalCents,
        'usd',
        affiliateVendorId ?? undefined
      )

      const supabase = createClient()
      await supabase.from('stripe_purchases').insert({
        stripe_session_id: `pi_${paymentIntent.id}`,
        stripe_payment_intent: paymentIntent.id,
        shopify_draft_order_id: draftOrderId,
        shopify_order_id: orderId || null,
        customer_email: shippingAddress.email || null,
        amount_total: subtotalCents,
        currency: 'usd',
        status: 'completed',
        metadata: paymentIntent.metadata,
        created_at: new Date().toISOString(),
      })

      // Track purchase in PostHog for conversion rate analysis
      if (shippingAddress.email) {
        const posthogResult = await capturePostHogServerEvent(
          'purchase',
          shippingAddress.email.toLowerCase().trim(),
          {
            value: subtotalCents / 100, // Convert cents to dollars
            currency: 'USD',
            transaction_id: paymentIntent.id,
            source: 'stripe_embedded_confirmation',
            $set: { has_purchased: true },
          }
        )
        if (!posthogResult.success) {
          console.warn('[checkout/confirm-payment] PostHog purchase tracking failed:', posthogResult.error)
        }
      }

      return NextResponse.json({
        success: true,
        redirectUrl: `${baseUrl}/shop/checkout/success?payment_intent=${paymentIntent.id}`,
      })
    }

    if (paymentIntent.status === 'requires_action') {
      return NextResponse.json({
        requires_action: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      })
    }

    return NextResponse.json({ error: 'Payment could not be completed' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment failed'
    console.error('[checkout/confirm-payment] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
