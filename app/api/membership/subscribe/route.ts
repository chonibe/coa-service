import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, isCollector, RBACError } from '@/lib/rbac'
import { MEMBERSHIP_TIERS, type MembershipTierId } from '@/lib/membership/tiers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

/**
 * POST /api/membership/subscribe
 * 
 * Creates a Stripe Checkout session for membership subscription.
 * Requires authenticated collector with membership:subscribe permission.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const ctx = await getUserContext(supabase)

    // Require authentication and collector role
    if (!ctx) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!isCollector(ctx)) {
      return NextResponse.json(
        { error: 'Collector account required to subscribe' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { tierId } = body as { tierId: MembershipTierId }

    // Validate tier
    const tier = MEMBERSHIP_TIERS[tierId]
    if (!tier) {
      return NextResponse.json(
        { error: 'Invalid membership tier' },
        { status: 400 }
      )
    }

    if (!tier.stripePriceId) {
      return NextResponse.json(
        { error: 'Membership tier not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // Get or create collector record
    const { data: collector, error: collectorError } = await supabase
      .from('collectors')
      .select('id, stripe_customer_id')
      .eq('email', ctx.email)
      .maybeSingle()

    if (collectorError) {
      console.error('[membership/subscribe] Collector lookup error:', collectorError)
      return NextResponse.json(
        { error: 'Failed to lookup collector' },
        { status: 500 }
      )
    }

    // Check if already has active subscription
    if (collector) {
      const { data: existingSub } = await supabase
        .from('collector_credit_subscriptions')
        .select('id, status, tier')
        .eq('collector_id', collector.id)
        .eq('status', 'active')
        .maybeSingle()

      if (existingSub) {
        return NextResponse.json(
          { 
            error: 'Already have an active subscription',
            currentTier: existingSub.tier,
            message: 'Use the change-tier endpoint to upgrade or downgrade'
          },
          { status: 400 }
        )
      }
    }

    // Get or create Stripe customer
    let stripeCustomerId = collector?.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: ctx.email,
        metadata: {
          collector_id: collector?.id || '',
          user_id: ctx.userId,
        },
      })
      stripeCustomerId = customer.id

      // Save Stripe customer ID to collector
      if (collector) {
        await supabase
          .from('collectors')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', collector.id)
      }
    }

    // Build success/cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000'
    const successUrl = `${baseUrl}/shop/membership/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/shop/membership?cancelled=true`

    // Create Stripe Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: tier.stripePriceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          tier_id: tierId,
          user_id: ctx.userId,
          collector_identifier: ctx.email,
          monthly_credits: tier.monthlyCredits.toString(),
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: 'membership_subscription',
        tier_id: tierId,
        user_id: ctx.userId,
        collector_identifier: ctx.email,
      },
      allow_promotion_codes: true,
    })

    // Log checkout session for tracking
    await supabase.from('checkout_sessions').insert({
      session_id: session.id,
      collector_id: collector?.id,
      collector_identifier: ctx.email,
      session_type: 'subscription',
      status: 'pending',
      line_items: [{ tier_id: tierId, price: tier.priceMonthly }],
      subtotal_cents: tier.priceMonthly * 100,
      credits_discount_cents: 0,
      stripe_charge_cents: tier.priceMonthly * 100,
      metadata: { tier },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('[membership/subscribe] Error:', error)
    
    if (error instanceof RBACError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'UNAUTHORIZED' ? 401 : 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
