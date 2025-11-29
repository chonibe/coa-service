import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrCreateCollectorAccount } from '@/lib/banking/account-manager';
import type { CollectorAccountType } from '@/lib/banking/types';

/**
 * POST /api/banking/subscriptions/create
 * Create a new credit subscription
 * Body: { 
 *   collector_identifier, 
 *   monthly_credit_amount, 
 *   billing_amount_usd, 
 *   payment_method, 
 *   payment_subscription_id?,
 *   subscription_tier?,
 *   account_type,
 *   vendor_id?
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      collector_identifier,
      monthly_credit_amount,
      billing_amount_usd,
      payment_method,
      payment_subscription_id,
      subscription_tier,
      account_type,
      vendor_id,
    } = body;

    if (!collector_identifier) {
      return NextResponse.json(
        { error: 'collector_identifier is required' },
        { status: 400 }
      );
    }

    if (!monthly_credit_amount || monthly_credit_amount <= 0) {
      return NextResponse.json(
        { error: 'Valid monthly_credit_amount is required' },
        { status: 400 }
      );
    }

    if (!billing_amount_usd || billing_amount_usd <= 0) {
      return NextResponse.json(
        { error: 'Valid billing_amount_usd is required' },
        { status: 400 }
      );
    }

    if (!payment_method) {
      return NextResponse.json(
        { error: 'payment_method is required' },
        { status: 400 }
      );
    }

    // Ensure account exists
    await getOrCreateCollectorAccount(
      collector_identifier,
      account_type || 'customer',
      vendor_id
    );

    const supabase = createClient();

    // Check for existing active subscription
    const { data: existing } = await supabase
      .from('collector_credit_subscriptions')
      .select('id')
      .eq('collector_identifier', collector_identifier)
      .eq('subscription_status', 'active')
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Active subscription already exists' },
        { status: 400 }
      );
    }

    // Calculate next billing date (30 days from now)
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);

    // Create subscription
    const { data: subscription, error } = await supabase
      .from('collector_credit_subscriptions')
      .insert({
        collector_identifier,
        subscription_status: 'active',
        monthly_credit_amount,
        subscription_tier: subscription_tier || null,
        billing_amount_usd,
        payment_method,
        payment_subscription_id: payment_subscription_id || null,
        next_billing_date: nextBillingDate.toISOString(),
      })
      .select()
      .single();

    if (error || !subscription) {
      console.error('Error creating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to create subscription', message: error?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        collectorIdentifier: subscription.collector_identifier,
        subscriptionStatus: subscription.subscription_status,
        monthlyCreditAmount: subscription.monthly_credit_amount,
        billingAmountUsd: subscription.billing_amount_usd,
        nextBillingDate: subscription.next_billing_date,
      },
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription', message: error.message },
      { status: 500 }
    );
  }
}

