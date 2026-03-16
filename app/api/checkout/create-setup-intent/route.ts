import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-03-31.basil' }) : null

/**
 * POST /api/checkout/create-setup-intent
 *
 * Creates a SetupIntent for collecting card/Link payment details in the payment modal.
 * Looks up or creates a Stripe Customer by email so the saved card is attached to the
 * customer and can be reused for future off-session charges.
 */
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment is not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const email: string | undefined = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : undefined

    let stripeCustomerId: string | undefined

    if (email) {
      const supabase = createClient()

      // Look up existing Stripe customer by email
      const { data: profile } = await supabase
        .from('collector_profiles')
        .select('stripe_customer_id')
        .ilike('email', email)
        .maybeSingle()

      if (profile?.stripe_customer_id) {
        stripeCustomerId = profile.stripe_customer_id
      } else {
        const { data: collector } = await supabase
          .from('collectors')
          .select('stripe_customer_id')
          .ilike('email', email)
          .maybeSingle()

        if (collector?.stripe_customer_id) {
          stripeCustomerId = collector.stripe_customer_id
        }
      }

      // Create a new Stripe Customer if none exists, so the saved card is attached
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({ email })
        stripeCustomerId = customer.id

        // Persist the new customer ID so future sessions can reuse it
        await supabase
          .from('collector_profiles')
          .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
          .ilike('email', email)

        await supabase
          .from('collectors')
          .update({ stripe_customer_id: stripeCustomerId })
          .ilike('email', email)
      }
    }

    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ['card', 'link'],
      usage: 'off_session',
      ...(stripeCustomerId && { customer: stripeCustomerId }),
      ...(email && { metadata: { collector_email: email } }),
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId: stripeCustomerId ?? null,
    })
  } catch (err: unknown) {
    console.error('[checkout/create-setup-intent] Error:', err)
    return NextResponse.json(
      { error: 'Failed to create setup' },
      { status: 500 }
    )
  }
}
