import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/banking/subscriptions/cancel
 * Cancel a subscription
 * Body: { subscription_id }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription_id } = body;

    if (!subscription_id) {
      return NextResponse.json(
        { error: 'subscription_id is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Update subscription to cancelled
    const { data: subscription, error } = await supabase
      .from('collector_credit_subscriptions')
      .update({
        subscription_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', subscription_id)
      .select()
      .single();

    if (error || !subscription) {
      console.error('Error cancelling subscription:', error);
      return NextResponse.json(
        { error: 'Failed to cancel subscription', message: error?.message },
        { status: 500 }
      );
    }

    // TODO: Cancel payment subscription with Stripe/PayPal if needed

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: {
        id: subscription.id,
        subscriptionStatus: subscription.subscription_status,
        cancelledAt: subscription.cancelled_at,
      },
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription', message: error.message },
      { status: 500 }
    );
  }
}

