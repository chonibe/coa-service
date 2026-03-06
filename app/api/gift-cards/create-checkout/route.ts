import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-03-31.basil' }) : null

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'

const MIN_AMOUNT_CENTS = 10 // $0.10 (for testing)
const MAX_AMOUNT_CENTS = 50000 // $500
const SEASON1_ARTWORK_CENTS = 4000 // $40

type GiftCardType = 'value' | 'street_lamp' | 'season1_artwork'

interface CreateGiftCardCheckoutRequest {
  amountCents: number
  giftCardType?: GiftCardType
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
    const {
      amountCents,
      giftCardType = 'value',
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
    if (giftCardType === 'value' && (amount < MIN_AMOUNT_CENTS || amount > MAX_AMOUNT_CENTS)) {
      return NextResponse.json(
        {
          error: `Amount must be between $${(MIN_AMOUNT_CENTS / 100).toFixed(1)} and $${(MAX_AMOUNT_CENTS / 100).toFixed(0)}`,
        },
        { status: 400 }
      )
    }

    const productLabel =
      giftCardType === 'street_lamp'
        ? '1 Street Lamp'
        : giftCardType === 'season1_artwork'
          ? '1 Season 1 Artwork ($40)'
          : null

    const metadata: Record<string, string> = {
      source: 'gift_card_purchase',
      gift_card_amount_cents: String(amount),
      gift_card_type: giftCardType,
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

    const lineItemName = productLabel
      ? `Gift Card: ${productLabel}`
      : `Gift Card - $${(amount / 100).toFixed(2)}`
    const lineItemDesc = productLabel
      ? `Redeemable for ${productLabel}. Code will be emailed after purchase.`
      : 'Digital gift card redeemable at checkout. Code will be emailed after purchase.'

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'custom',
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
                gift_card_type: giftCardType,
              },
            },
          },
          quantity: 1,
        },
      ],
      metadata,
      return_url: `${baseUrl}/shop/gift-cards/success?session_id={CHECKOUT_SESSION_ID}`,
      allow_promotion_codes: false,
      billing_address_collection: 'auto',
      payment_intent_data: {
        setup_future_usage: 'off_session',
      },
      ...(stripeCustomerId
        ? { customer: stripeCustomerId }
        : customerEmail?.trim()
          ? { customer_email: customerEmail.trim().toLowerCase() }
          : {}),
    })

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout'
    console.error('[gift-cards/create-checkout] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
