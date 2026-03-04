import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-03-31.basil' }) : null

/**
 * GET /api/gift-cards/by-session?session_id=xxx
 *
 * Returns gift card details for a completed checkout session.
 * Verifies session is paid via Stripe before returning code.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId?.trim()) {
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    )
  }

  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment is not configured' },
      { status: 503 }
    )
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    })

    if (session.metadata?.source !== 'gift_card_purchase') {
      return NextResponse.json(
        { error: 'Not a gift card session' },
        { status: 400 }
      )
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data: giftCard, error } = await supabase
      .from('gift_cards')
      .select('code, amount_cents, currency, recipient_email, status')
      .eq('stripe_session_id', sessionId)
      .maybeSingle()

    if (error) {
      console.error('[gift-cards/by-session] Supabase error:', error)
      return NextResponse.json(
        { error: 'Could not fetch gift card' },
        { status: 500 }
      )
    }

    if (!giftCard) {
      return NextResponse.json(
        {
          error: 'Gift card is being prepared. Please check your email shortly.',
          status: 'pending',
        },
        { status: 202 }
      )
    }

    if (giftCard.status === 'provisioning_failed') {
      return NextResponse.json(
        {
          error: 'There was an issue preparing your gift card. Our team has been notified and will contact you.',
          status: 'provisioning_failed',
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      code: giftCard.code,
      amountCents: giftCard.amount_cents,
      currency: giftCard.currency,
      recipientEmail: giftCard.recipient_email ?? undefined,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch gift card'
    console.error('[gift-cards/by-session] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
