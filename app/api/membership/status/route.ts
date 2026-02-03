import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, isCollector } from '@/lib/rbac'
import { MEMBERSHIP_TIERS, calculateCreditsValue } from '@/lib/membership/tiers'

/**
 * GET /api/membership/status
 * 
 * Returns the current user's membership status, subscription details,
 * and credit balance information.
 */
export async function GET(request: NextRequest) {
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

    // Non-collectors have no membership
    if (!isCollector(ctx)) {
      return NextResponse.json({
        isMember: false,
        subscription: null,
        credits: null,
        tier: null,
      })
    }

    // Get collector record
    const { data: collector, error: collectorError } = await supabase
      .from('collectors')
      .select('id, email, stripe_customer_id')
      .eq('email', ctx.email)
      .maybeSingle()

    if (collectorError || !collector) {
      return NextResponse.json({
        isMember: false,
        subscription: null,
        credits: null,
        tier: null,
      })
    }

    // Get active subscription
    const { data: subscription } = await supabase
      .from('collector_credit_subscriptions')
      .select(`
        id,
        tier,
        status,
        monthly_credit_amount,
        stripe_subscription_id,
        stripe_price_id,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        cancelled_at,
        created_at
      `)
      .eq('collector_id', collector.id)
      .in('status', ['active', 'past_due', 'trialing'])
      .maybeSingle()

    // Get credit balance from ledger
    const { data: balanceData } = await supabase
      .from('collector_accounts')
      .select('credits_balance')
      .eq('collector_id', collector.id)
      .maybeSingle()

    const creditBalance = balanceData?.credits_balance || 0

    // Calculate credit value and get tier info
    const tier = subscription?.tier ? MEMBERSHIP_TIERS[subscription.tier as keyof typeof MEMBERSHIP_TIERS] : null
    const creditValue = calculateCreditsValue(creditBalance)

    // Get recent transactions
    const { data: recentTransactions } = await supabase
      .from('collector_ledger_entries')
      .select('id, transaction_type, credits_amount, usd_amount, description, created_at, credit_source')
      .eq('collector_identifier', ctx.email)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      isMember: subscription?.status === 'active',
      subscription: subscription ? {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
        monthlyCredits: subscription.monthly_credit_amount,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelledAt: subscription.cancelled_at,
        createdAt: subscription.created_at,
      } : null,
      credits: {
        balance: creditBalance,
        valueUsd: creditValue,
      },
      tier: tier ? {
        id: tier.id,
        name: tier.name,
        priceMonthly: tier.priceMonthly,
        monthlyCredits: tier.monthlyCredits,
        features: tier.features,
        color: tier.color,
      } : null,
      recentTransactions: recentTransactions || [],
    })
  } catch (error) {
    console.error('[membership/status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch membership status' },
      { status: 500 }
    )
  }
}
