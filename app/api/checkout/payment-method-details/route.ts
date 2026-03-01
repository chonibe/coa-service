import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' }) : null

/**
 * POST /api/checkout/payment-method-details
 *
 * Returns brand and last4 for a PaymentMethod (e.g. after SetupIntent confirm).
 */
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
  }
  try {
    const { paymentMethodId } = await request.json()
    if (!paymentMethodId || typeof paymentMethodId !== 'string') {
      return NextResponse.json({ error: 'paymentMethodId required' }, { status: 400 })
    }
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
    const card = pm.card
    if (!card) {
      return NextResponse.json({ error: 'Not a card payment method' }, { status: 400 })
    }
    return NextResponse.json({
      brand: card.brand,
      last4: card.last4,
    })
  } catch (err: unknown) {
    console.error('[checkout/payment-method-details] Error:', err)
    return NextResponse.json({ error: 'Failed to get payment method' }, { status: 500 })
  }
}
