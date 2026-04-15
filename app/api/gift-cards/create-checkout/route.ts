import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-03-31.basil' }) : null

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'

const MIN_AMOUNT_CENTS = 10 // $0.10 (for testing)
const MAX_AMOUNT_CENTS = 50000 // $500

/** Gift cards are dollar-value only (no item-based options). */
interface CreateGiftCardCheckoutRequest {
  amountCents: number
  recipientEmail?: string
  customerEmail?: string
  design?: string
  giftMessage?: string
  sendAt?: string
  senderName?: string
}

/**
 * POST /api/gift-cards/create-checkout
 *
 * Creates a Stripe-hosted Checkout Session for gift card purchase (redirect via `url`).
 * On payment success, webhook provisions Stripe coupon + promotion code and emails the code.
 */
const GIFT_CARD_RATE_LIMIT = 10 // requests per minute per IP

export async function POST(request: NextRequest) {
  const id = getClientIdentifier(request)
  const rate = checkRateLimit(id, GIFT_CARD_RATE_LIMIT)
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
    const body: CreateGiftCardCheckoutRequest = await request.json()
    const {
      amountCents,
      recipientEmail,
      customerEmail,
      design,
      giftMessage,
      sendAt,
      senderName,
    } = body

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
          error: `Amount must be between $${(MIN_AMOUNT_CENTS / 100).toFixed(1)} and $${(MAX_AMOUNT_CENTS / 100).toFixed(0)}`,
        },
        { status: 400 }
      )
    }

    const metadata: Record<string, string> = {
      source: 'gift_card_purchase',
      gift_card_amount_cents: String(amount),
      gift_card_type: 'value',
    }
    if (recipientEmail?.trim()) {
      metadata.recipient_email = recipientEmail.trim().toLowerCase()
    }
    if (customerEmail?.trim()) {
      metadata.collector_email = customerEmail.trim().toLowerCase()
    }
    if (design?.trim()) metadata.gift_card_design = design.trim()
    if (giftMessage?.trim()) metadata.gift_message = giftMessage.trim().slice(0, 500)
    if (sendAt?.trim()) metadata.send_at = sendAt.trim()
    if (senderName?.trim()) metadata.sender_name = senderName.trim().slice(0, 200)

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

    const lineItemName = `Gift Card - $${(amount / 100).toFixed(2)}`
    const lineItemDesc = 'Digital gift card redeemable at checkout. Code will be emailed after purchase.'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'link', 'paypal'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            product_data: {
              name: lineItemName,
              description: lineItemDesc,
              metadata: {
                type: 'gift_card',
                gift_card_type: 'value',
              },
            },
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${baseUrl}/shop/gift-cards/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/shop/gift-cards?cancelled=true`,
      allow_promotion_codes: false,
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: true },
      payment_intent_data: {
        setup_future_usage: 'off_session',
      },
      ...(stripeCustomerId
        ? { customer: stripeCustomerId }
        : customerEmail?.trim()
          ? { customer_email: customerEmail.trim().toLowerCase() }
          : {}),
    })

    if (!session.url) {
      console.error('[gift-cards/create-checkout] Missing session.url for hosted Checkout')
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout'
    console.error('[gift-cards/create-checkout] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
