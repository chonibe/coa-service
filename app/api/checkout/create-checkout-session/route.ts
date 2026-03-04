import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-03-31.basil' }) : null

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'

interface CartLineItem {
  productId: string
  variantId: string
  variantGid: string
  handle: string
  title: string
  price: number
  quantity: number
  image?: string
}

interface CreateCheckoutSessionRequest {
  items: CartLineItem[]
  customerEmail?: string
  shippingAddress?: {
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
  /** Promo code to pre-apply (e.g. WELCOME10). Looked up in Stripe and applied via discounts. */
  promoCode?: string
}

/**
 * POST /api/checkout/create-checkout-session
 *
 * Creates a Checkout Session with ui_mode: "custom" for embedded Payment Element.
 * Returns clientSecret for CheckoutProvider (Stripe Elements with Checkout Sessions API).
 *
 * @see https://docs.stripe.com/payments/quickstart-checkout-sessions
 */
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment is not configured' },
      { status: 503 }
    )
  }

  try {
    const body: CreateCheckoutSessionRequest = await request.json()
    const { items, customerEmail, shippingAddress, promoCode } = body

    if (!items?.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const totalCents = items.reduce(
      (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
      0
    )

    if (totalCents <= 0) {
      return NextResponse.json(
        { error: 'Order total must be greater than zero' },
        { status: 400 }
      )
    }

    const shopifyVariantsCompact = items
      .map((i) => `${i.variantId.replace('gid://shopify/ProductVariant/', '')}:${i.quantity}`)
      .join(',')
    const email = customerEmail || shippingAddress?.email || ''

    const metadata: Record<string, string> = {
      source: 'experience_checkout',
      shopify_variant_ids: shopifyVariantsCompact,
      collector_email: email,
      collector_identifier: email,
      items_json: JSON.stringify(
        items.map((i) => ({
          variantId: i.variantId,
          variantGid: i.variantGid,
          handle: i.handle,
          title: i.title,
          price: i.price,
          quantity: i.quantity,
        }))
      ).slice(0, 500),
    }
    if (shippingAddress) {
      metadata.shipping_address = JSON.stringify({
        fullName: shippingAddress.fullName,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        phoneNumber: shippingAddress.phoneNumber,
      }).slice(0, 500)
    }

    // Look up existing Stripe customer so returning users can reuse saved payment methods
    let stripeCustomerId: string | undefined
    if (email?.trim()) {
      const supabase = createClient()
      const normalizedEmail = email.toLowerCase().trim()
      const { data: profile } = await supabase
        .from('collector_profiles')
        .select('stripe_customer_id')
        .ilike('email', normalizedEmail)
        .maybeSingle()
      if (profile?.stripe_customer_id) {
        stripeCustomerId = profile.stripe_customer_id
      } else {
        const { data: collector } = await supabase
          .from('collectors')
          .select('stripe_customer_id')
          .ilike('email', normalizedEmail)
          .maybeSingle()
        if (collector?.stripe_customer_id) {
          stripeCustomerId = collector.stripe_customer_id
        }
      }
    }

    // Look up and pre-apply promo code if provided
    let discounts: Array<{ promotion_code: string }> | undefined
    if (promoCode?.trim()) {
      const trimmed = promoCode.trim().toUpperCase()
      const { data: promoCodes } = await stripe.promotionCodes.list({ code: trimmed, active: true })
      const promo = promoCodes?.[0]
      if (promo?.coupon?.valid) {
        discounts = [{ promotion_code: promo.id }]
      }
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'custom',
      mode: 'payment',
      return_url: `${baseUrl}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      ...(stripeCustomerId ? { customer: stripeCustomerId } : (email ? { customer_email: email } : {})),
      payment_method_types: ['card', 'link', 'paypal'],
      automatic_tax: { enabled: false },
      allow_promotion_codes: true,
      ...(discounts?.length ? { discounts } : {}),
      billing_address_collection: 'auto',
      payment_intent_data: {
        setup_future_usage: 'off_session',
      },
      metadata,
      line_items: items.map((item) => ({
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(item.price * 100),
          product_data: {
            name: item.title,
            images: item.image ? [item.image] : undefined,
            metadata: {
              shopify_variant_id: item.variantId.replace('gid://shopify/ProductVariant/', ''),
              product_handle: item.handle,
            },
          },
        },
        quantity: item.quantity,
      })),
    })

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session'
    console.error('[checkout/create-checkout-session] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
