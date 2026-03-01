import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' }) : null

/**
 * POST /api/checkout/create-setup-intent
 *
 * Creates a SetupIntent for collecting card/Link payment details in the payment modal.
 * Used when user selects "Credit Card" or "Google Pay" to enter card in-app.
 */
export async function POST() {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment is not configured' },
      { status: 503 }
    )
  }

  try {
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ['card', 'link'],
      usage: 'off_session',
    })
    return NextResponse.json({ clientSecret: setupIntent.client_secret })
  } catch (err: unknown) {
    console.error('[checkout/create-setup-intent] Error:', err)
    return NextResponse.json(
      { error: 'Failed to create setup' },
      { status: 500 }
    )
  }
}
