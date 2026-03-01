import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { extractVariantId } from '@/lib/shopify/storefront-client'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' })
  : null

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface CartLineItem {
  productId: string
  variantId: string
  variantGid: string
  handle: string
  title: string
  price: number // in dollars
  quantity: number
  image?: string
}

interface CreateCheckoutSessionRequest {
  items: CartLineItem[]
  customerEmail?: string
}

/**
 * POST /api/checkout/create-checkout-session
 *
 * Creates a Stripe Checkout Session with ui_mode: "custom" for embedded checkout.
 * Returns clientSecret for use with CheckoutProvider and Payment Element.
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
    const { items, customerEmail } = body

    if (!items?.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item) => ({
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(item.price * 100),
          product_data: {
            name: item.title,
            images: item.image ? [item.image] : undefined,
            metadata: {
              shopify_variant_id: extractVariantId(item.variantId),
              shopify_variant_gid: item.variantId,
              product_handle: item.handle || '',
            },
          },
        },
        quantity: item.quantity,
      })
    )

    const shopifyVariantsCompact = items
      .map((i) => `${extractVariantId(i.variantId)}:${i.quantity}`)
      .join(',')

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'custom',
      mode: 'payment',
      line_items: lineItems,
      return_url: `${APP_URL}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: customerEmail || undefined,
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: [
          'US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE',
          'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'GR', 'PL',
          'CZ', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE',
          'LU', 'MT', 'CY', 'NZ', 'SG', 'HK', 'JP', 'KR', 'IL', 'AE',
        ],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'usd' },
            display_name: 'Free shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 10 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 1500, currency: 'usd' },
            display_name: 'Express shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 2 },
              maximum: { unit: 'business_day', value: 5 },
            },
          },
        },
      ],
      metadata: {
        source: 'checkout_session',
        shopify_variant_ids: shopifyVariantsCompact,
      },
    })

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
    })
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to create checkout session'
    console.error('[checkout/create-checkout-session] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
