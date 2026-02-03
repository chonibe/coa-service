import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, isCollector } from '@/lib/rbac'
import { MEMBERSHIP_TIERS, compareTiers, type MembershipTierId } from '@/lib/membership/tiers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

/**
 * POST /api/membership/change-tier
 * 
 * Changes the user's membership tier (upgrade or downgrade).
 * Stripe handles proration automatically.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const ctx = await getUserContext(supabase)

    // Require authentication
    if (!ctx) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!isCollector(ctx)) {
      return NextResponse.json(
        { error: 'Collector account required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { newTierId, prorationBehavior = 'create_prorations' } = body as { 
      newTierId: MembershipTierId
      prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
    }

    // Validate new tier
    const newTier = MEMBERSHIP_TIERS[newTierId]
    if (!newTier) {
      return NextResponse.json(
        { error: 'Invalid membership tier' },
        { status: 400 }
      )
    }

    if (!newTier.stripePriceId) {
      return NextResponse.json(
        { error: 'Membership tier not configured' },
        { status: 500 }
      )
    }

    // Get collector record
    const { data: collector } = await supabase
      .from('collectors')
      .select('id')
      .eq('email', ctx.email)
      .maybeSingle()

    if (!collector) {
      return NextResponse.json(
        { error: 'Collector not found' },
        { status: 404 }
      )
    }

    // Get current subscription
    const { data: subscription } = await supabase
      .from('collector_credit_subscriptions')
      .select('id, tier, stripe_subscription_id, stripe_price_id')
      .eq('collector_id', collector.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found. Please subscribe first.' },
        { status: 404 }
      )
    }

    if (!subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Subscription not linked to Stripe' },
        { status: 400 }
      )
    }

    const currentTierId = subscription.tier as MembershipTierId
    const currentTier = MEMBERSHIP_TIERS[currentTierId]

    // Check if it's the same tier
    const direction = compareTiers(currentTierId, newTierId)
    if (direction === 'same') {
      return NextResponse.json(
        { error: 'Already on this tier' },
        { status: 400 }
      )
    }

    // Get the Stripe subscription to find the subscription item
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    )

    const subscriptionItemId = stripeSubscription.items.data[0]?.id
    if (!subscriptionItemId) {
      return NextResponse.json(
        { error: 'Could not find subscription item' },
        { status: 500 }
      )
    }

    // Update subscription in Stripe
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        items: [
          {
            id: subscriptionItemId,
            price: newTier.stripePriceId,
          },
        ],
        proration_behavior: prorationBehavior,
        metadata: {
          tier_id: newTierId,
          previous_tier_id: currentTierId,
          user_id: ctx.userId,
          collector_identifier: ctx.email,
          monthly_credits: newTier.monthlyCredits.toString(),
        },
      }
    )

    // Update local subscription record
    await supabase
      .from('collector_credit_subscriptions')
      .update({
        tier: newTierId,
        monthly_credit_amount: newTier.monthlyCredits,
        stripe_price_id: newTier.stripePriceId,
        // If was cancelled, reactivate
        cancel_at_period_end: false,
        cancelled_at: null,
      })
      .eq('id', subscription.id)

    // Calculate credit adjustment for immediate upgrade bonus
    // If upgrading, give difference in credits immediately
    let creditAdjustment = 0
    if (direction === 'upgrade') {
      creditAdjustment = newTier.monthlyCredits - currentTier.monthlyCredits
      
      // Add bonus credits to ledger
      if (creditAdjustment > 0) {
        await supabase.from('collector_ledger_entries').insert({
          collector_identifier: ctx.email,
          transaction_type: 'deposit',
          credits_amount: creditAdjustment,
          usd_amount: creditAdjustment * 0.10, // $0.10 per credit
          description: `Upgrade bonus: ${currentTier.name} → ${newTier.name}`,
          credit_source: 'subscription',
          reference_type: 'subscription_change',
          reference_id: subscription.id,
        })

        // Update account balance
        await supabase.rpc('increment_collector_credits', {
          p_collector_identifier: ctx.email,
          p_amount: creditAdjustment,
        })
      }
    }

    return NextResponse.json({
      success: true,
      direction,
      previousTier: {
        id: currentTierId,
        name: currentTier.name,
        monthlyCredits: currentTier.monthlyCredits,
      },
      newTier: {
        id: newTierId,
        name: newTier.name,
        monthlyCredits: newTier.monthlyCredits,
      },
      creditAdjustment,
      message: direction === 'upgrade' 
        ? `Upgraded to ${newTier.name}! ${creditAdjustment > 0 ? `Bonus ${creditAdjustment} credits added.` : ''}`
        : `Downgraded to ${newTier.name}. Your new credit amount will apply at the next billing cycle.`,
    })
  } catch (error) {
    console.error('[membership/change-tier] Error:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to change tier' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/membership/change-tier
 * 
 * Returns available tier options and proration preview.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const ctx = await getUserContext(supabase)

    if (!ctx || !isCollector(ctx)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get collector record
    const { data: collector } = await supabase
      .from('collectors')
      .select('id')
      .eq('email', ctx.email)
      .maybeSingle()

    if (!collector) {
      return NextResponse.json(
        { error: 'Collector not found' },
        { status: 404 }
      )
    }

    // Get current subscription
    const { data: subscription } = await supabase
      .from('collector_credit_subscriptions')
      .select('tier, stripe_subscription_id, current_period_end')
      .eq('collector_id', collector.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!subscription) {
      return NextResponse.json({
        currentTier: null,
        availableTiers: Object.values(MEMBERSHIP_TIERS).map(tier => ({
          id: tier.id,
          name: tier.name,
          priceMonthly: tier.priceMonthly,
          monthlyCredits: tier.monthlyCredits,
          features: tier.features,
          highlighted: tier.highlighted,
        })),
      })
    }

    const currentTierId = subscription.tier as MembershipTierId
    const currentTier = MEMBERSHIP_TIERS[currentTierId]

    // Build available tiers with upgrade/downgrade info
    const availableTiers = Object.values(MEMBERSHIP_TIERS).map(tier => {
      const direction = compareTiers(currentTierId, tier.id)
      return {
        id: tier.id,
        name: tier.name,
        priceMonthly: tier.priceMonthly,
        monthlyCredits: tier.monthlyCredits,
        features: tier.features,
        highlighted: tier.highlighted,
        direction,
        isCurrent: direction === 'same',
        creditDifference: tier.monthlyCredits - currentTier.monthlyCredits,
        priceDifference: tier.priceMonthly - currentTier.priceMonthly,
      }
    })

    return NextResponse.json({
      currentTier: {
        id: currentTierId,
        name: currentTier.name,
        priceMonthly: currentTier.priceMonthly,
        monthlyCredits: currentTier.monthlyCredits,
      },
      currentPeriodEnd: subscription.current_period_end,
      availableTiers,
    })
  } catch (error) {
    console.error('[membership/change-tier] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tier options' },
      { status: 500 }
    )
  }
}
