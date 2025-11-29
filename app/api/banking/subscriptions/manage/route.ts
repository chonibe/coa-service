import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/banking/subscriptions/manage
 * Get subscription details
 * Query params: collector_identifier (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectorIdentifier = searchParams.get('collector_identifier');

    if (!collectorIdentifier) {
      return NextResponse.json(
        { error: 'collector_identifier is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data: subscriptions, error } = await supabase
      .from('collector_credit_subscriptions')
      .select('*')
      .eq('collector_identifier', collectorIdentifier)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions || [],
    });
  } catch (error: any) {
    console.error('Error getting subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to get subscriptions', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/banking/subscriptions/manage
 * Update subscription (pause, resume, update amount)
 * Body: { subscription_id, updates: { subscription_status?, monthly_credit_amount? } }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription_id, updates } = body;

    if (!subscription_id) {
      return NextResponse.json(
        { error: 'subscription_id is required' },
        { status: 400 }
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'updates object is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Build update object
    const updateData: any = {};

    if (updates.subscription_status) {
      updateData.subscription_status = updates.subscription_status;
      
      // Set paused_at or cancelled_at based on status
      if (updates.subscription_status === 'paused') {
        updateData.paused_at = new Date().toISOString();
      } else if (updates.subscription_status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      } else if (updates.subscription_status === 'active') {
        updateData.paused_at = null;
      }
    }

    if (updates.monthly_credit_amount) {
      updateData.monthly_credit_amount = updates.monthly_credit_amount;
    }

    const { data: subscription, error } = await supabase
      .from('collector_credit_subscriptions')
      .update(updateData)
      .eq('id', subscription_id)
      .select()
      .single();

    if (error || !subscription) {
      console.error('Error updating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to update subscription', message: error?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        subscriptionStatus: subscription.subscription_status,
        monthlyCreditAmount: subscription.monthly_credit_amount,
        nextBillingDate: subscription.next_billing_date,
      },
    });
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription', message: error.message },
      { status: 500 }
    );
  }
}

