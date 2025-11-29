import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { depositSubscriptionCredits } from '@/lib/banking/subscription-deposit';

/**
 * POST /api/cron/subscription-credits
 * Cron job to deposit monthly subscription credits
 * Checks all active subscriptions with next_billing_date <= today
 * Authenticated via CRON_SECRET header
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // Get all active subscriptions that are due for billing
    const today = new Date().toISOString().split('T')[0];
    const { data: subscriptions, error } = await supabase
      .from('collector_credit_subscriptions')
      .select('*')
      .eq('subscription_status', 'active')
      .lte('next_billing_date', `${today}T23:59:59Z`);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions', message: error.message },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscriptions due for billing',
        processed: 0,
      });
    }

    // Process each subscription
    const results = [];
    for (const subscription of subscriptions) {
      try {
        const result = await depositSubscriptionCredits(
          subscription.id,
          subscription.collector_identifier,
          Number(subscription.monthly_credit_amount)
        );

        results.push({
          subscriptionId: subscription.id,
          collectorIdentifier: subscription.collector_identifier,
          success: result.success,
          creditsDeposited: result.creditsDeposited,
          error: result.error,
        });
      } catch (error: any) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        results.push({
          subscriptionId: subscription.id,
          collectorIdentifier: subscription.collector_identifier,
          success: false,
          creditsDeposited: 0,
          error: error.message,
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Processed ${subscriptions.length} subscriptions`,
      processed: subscriptions.length,
      successful,
      failed,
      results,
    });
  } catch (error: any) {
    console.error('Error in subscription credits cron:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription credits', message: error.message },
      { status: 500 }
    );
  }
}

