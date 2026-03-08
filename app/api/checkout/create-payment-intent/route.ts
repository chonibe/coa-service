import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' }) : null

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

interface CreatePaymentIntentRequest {
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
}

const PAYMENT_INTENT_RATE_LIMIT = 20 // requests per minute per IP

/**
 * POST /api/checkout/create-payment-intent
 *
 * Creates a PaymentIntent for the in-drawer checkout flow.
 * Supports card (incl. Google Pay wallets), Link, and PayPal.
 */
export async function POST(request: NextRequest) {
  const id = getClientIdentifier(request)
  const rate = checkRateLimit(id, PAYMENT_INTENT_RATE_LIMIT)
  if (!rate.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment is not configured' },
      { status: 503 }
    )
  }

  try {
    const body: CreatePaymentIntentRequest = await request.json()
    const { items, customerEmail, shippingAddress } = body

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
      .map((i) => `${i.variantId}:${i.quantity}`)
      .join(',')

    const email = customerEmail || shippingAddress?.email || ''

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
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
      },
      ...(email && { receipt_email: email }),
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create payment'
    console.error('[checkout/create-payment-intent] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
