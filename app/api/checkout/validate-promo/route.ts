import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-03-31.basil' }) : null

/**
 * POST /api/checkout/validate-promo
 *
 * Validates a promo code against Stripe. Returns discount info for UI display.
 * Stripe still applies/validates at checkout.
 */
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { valid: false, message: 'Checkout not configured' },
      { status: 503 }
    )
  }
  try {
    const body = await request.json()
    const { code, subtotalCents } = body as { code?: string; subtotalCents?: number }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, message: 'Promo code is required' },
        { status: 400 }
      )
    }

    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      return NextResponse.json(
        { valid: false, message: 'Please enter a promo code' },
        { status: 400 }
      )
    }

    // Look up promotion codes by code
    const { data: promoCodes } = await stripe.promotionCodes.list({
      code: trimmed,
      active: true,
    })

    if (!promoCodes?.length) {
      return NextResponse.json({
        valid: false,
        message: 'This promo code is not valid',
        discountCents: 0,
      })
    }

    const promo = promoCodes[0]
    const coupon = promo.coupon

    if (!coupon?.valid) {
      return NextResponse.json({
        valid: false,
        message: 'This promo code has expired',
        discountCents: 0,
      })
    }

    let discountCents = 0
    if (coupon.percent_off) {
      if (typeof subtotalCents === 'number' && subtotalCents > 0) {
        discountCents = Math.round(subtotalCents * (coupon.percent_off / 100))
      }
      return NextResponse.json({
        valid: true,
        message: `${coupon.percent_off}% off`,
        percentOff: coupon.percent_off,
        discountCents,
      })
    }
    if (coupon.amount_off) {
      discountCents = coupon.amount_off
    }

    return NextResponse.json({
      valid: true,
      message: discountCents > 0 ? `-$${(discountCents / 100).toFixed(2)}` : 'Applied',
      discountCents,
    })
  } catch (error) {
    console.error('[checkout/validate-promo] Error:', error)
    return NextResponse.json(
      { valid: false, message: 'Could not validate promo code', discountCents: 0 },
      { status: 500 }
    )
  }
}
