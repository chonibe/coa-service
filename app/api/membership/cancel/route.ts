import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, isCollector } from '@/lib/rbac'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

/**
 * POST /api/membership/cancel
 * 
 * Cancels the user's membership subscription.
 * By default, cancels at the end of the current billing period.
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
    const body = await request.json().catch(() => ({}))
    const { immediate = false } = body as { immediate?: boolean }

    // Get collector record
    const { data: collector, error: collectorError } = await supabase
      .from('collectors')
      .select('id')
      .eq('email', ctx.email)
      .maybeSingle()

    if (collectorError || !collector) {
      return NextResponse.json(
        { error: 'Collector not found' },
        { status: 404 }
      )
    }

    // Get active subscription
    const { data: subscription, error: subError } = await supabase
      .from('collector_credit_subscriptions')
      .select('id, stripe_subscription_id, status, current_period_end')
      .eq('collector_id', collector.id)
      .eq('status', 'active')
      .maybeSingle()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    if (!subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Subscription not linked to Stripe' },
        { status: 400 }
      )
    }

    // Cancel in Stripe
    if (immediate) {
      // Cancel immediately - no refund
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
      
      // Update local record
      await supabase
        .from('collector_credit_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subscription.id)

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled immediately',
        effectiveDate: new Date().toISOString(),
      })
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      })

      // Update local record
      await supabase
        .from('collector_credit_subscriptions')
        .update({
          cancel_at_period_end: true,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subscription.id)

      return NextResponse.json({
        success: true,
        message: 'Subscription will cancel at end of billing period',
        effectiveDate: subscription.current_period_end,
        canReactivate: true,
      })
    }
  } catch (error) {
    console.error('[membership/cancel] Error:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/membership/cancel
 * 
 * Reactivates a subscription that was set to cancel at period end.
 */
export async function DELETE(request: NextRequest) {
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

    // Get subscription that's set to cancel
    const { data: subscription } = await supabase
      .from('collector_credit_subscriptions')
      .select('id, stripe_subscription_id, cancel_at_period_end')
      .eq('collector_id', collector.id)
      .eq('status', 'active')
      .eq('cancel_at_period_end', true)
      .maybeSingle()

    if (!subscription) {
      return NextResponse.json(
        { error: 'No cancellation pending' },
        { status: 404 }
      )
    }

    if (!subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Subscription not linked to Stripe' },
        { status: 400 }
      )
    }

    // Reactivate in Stripe
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    })

    // Update local record
    await supabase
      .from('collector_credit_subscriptions')
      .update({
        cancel_at_period_end: false,
        cancelled_at: null,
      })
      .eq('id', subscription.id)

    return NextResponse.json({
      success: true,
      message: 'Subscription reactivated',
    })
  } catch (error) {
    console.error('[membership/cancel] Reactivation error:', error)
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    )
  }
}
