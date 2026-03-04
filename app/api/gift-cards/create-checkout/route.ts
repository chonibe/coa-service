import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-03-31.basil' }) : null

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'

const MIN_AMOUNT_CENTS = 1000 // $10
const MAX_AMOUNT_CENTS = 50000 // $500

interface CreateGiftCardCheckoutRequest {
  amountCents: number
  recipientEmail?: string
  customerEmail?: string
}

/**
 * POST /api/gift-cards/create-checkout
 *
 * Creates a Stripe Checkout Session for gift card purchase (redirect flow).
 * On payment success, webhook provisions Stripe coupon + promotion code and emails the code.
 */
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment is not configured' },
      { status: 503 }
    )
  }

  try {
    const body: CreateGiftCardCheckoutRequest = await request.json()
    const { amountCents, recipientEmail, customerEmail } = body

    if (!amountCents || typeof amountCents !== 'number') {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      )
    }

    const amount = Math.round(amountCents)
    if (amount < MIN_AMOUNT_CENTS || amount > MAX_AMOUNT_CENTS) {
      return NextResponse.json(
        {
          error: `Amount must be between $${(MIN_AMOUNT_CENTS / 100).toFixed(0)} and $${(MAX_AMOUNT_CENTS / 100).toFixed(0)}`,
        },
        { status: 400 }
      )
    }

    const metadata: Record<string, string> = {
      source: 'gift_card_purchase',
      gift_card_amount_cents: String(amount),
    }
    if (recipientEmail?.trim()) {
      metadata.recipient_email = recipientEmail.trim().toLowerCase()
    }
    if (customerEmail?.trim()) {
      metadata.collector_email = customerEmail.trim().toLowerCase()
    }

    let stripeCustomerId: string | undefined
    if (customerEmail?.trim()) {
      const supabase = createClient()
      const normalizedEmail = customerEmail.trim().toLowerCase()
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

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'link', 'paypal'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            product_data: {
              name: `Gift Card - $${(amount / 100).toFixed(2)}`,
              description: 'Digital gift card redeemable at checkout. Code will be emailed after purchase.',
              metadata: {
                type: 'gift_card',
              },
            },
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${baseUrl}/shop/gift-cards/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/shop/gift-cards`,
      allow_promotion_codes: false,
      billing_address_collection: 'auto',
      ...(stripeCustomerId
        ? { customer: stripeCustomerId }
        : customerEmail?.trim()
          ? { customer_email: customerEmail.trim().toLowerCase() }
          : {}),
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout'
    console.error('[gift-cards/create-checkout] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
