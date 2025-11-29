import { createClient } from '@/lib/supabase/server';
import { calculateCollectorBalance } from './balance-calculator';
import type { CreditDepositResult } from './types';

/**
 * Deposit credits from monthly subscription
 * Called by cron job for active subscriptions
 * 
 * @param subscriptionId - Subscription ID
 * @param collectorIdentifier - Collector identifier
 * @param creditAmount - Amount of credits to deposit
 */
export async function depositSubscriptionCredits(
  subscriptionId: string,
  collectorIdentifier: string,
  creditAmount: number
): Promise<CreditDepositResult> {
  const supabase = createClient();

  try {
    if (creditAmount <= 0) {
      return {
        success: false,
        creditsDeposited: 0,
        newBalance: 0,
        error: 'Invalid credit amount',
      };
    }

    // Check for duplicate deposit (prevent double-crediting in same billing cycle)
    // Check if credits were already deposited for this subscription today
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('collector_ledger_entries')
      .select('id')
      .eq('collector_identifier', collectorIdentifier)
      .eq('transaction_type', 'subscription_credit')
      .eq('subscription_id', subscriptionId)
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`)
      .single();

    if (existing) {
      // Already credited today, return current balance
      const balance = await calculateCollectorBalance(collectorIdentifier);
      return {
        success: true,
        ledgerEntryId: existing.id,
        creditsDeposited: 0, // No new credits
        newBalance: balance.balance,
      };
    }

    // Create ledger entry
    const { data: ledgerEntry, error: ledgerError } = await supabase
      .from('collector_ledger_entries')
      .insert({
        collector_identifier: collectorIdentifier,
        transaction_type: 'subscription_credit',
        amount: creditAmount,
        subscription_id: subscriptionId,
        description: `Monthly subscription credits: ${creditAmount} credits`,
        created_by: 'system',
        metadata: {
          subscription_id: subscriptionId,
          credit_amount: creditAmount,
        },
      })
      .select()
      .single();

    if (ledgerError || !ledgerEntry) {
      console.error('Error creating subscription ledger entry:', ledgerError);
      return {
        success: false,
        creditsDeposited: 0,
        newBalance: 0,
        error: `Failed to create ledger entry: ${ledgerError?.message || 'Unknown error'}`,
      };
    }

    // Update subscription last_credited_at
    await supabase
      .from('collector_credit_subscriptions')
      .update({
        last_credited_at: new Date().toISOString(),
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      })
      .eq('id', subscriptionId);

    // Calculate new balance
    const balance = await calculateCollectorBalance(collectorIdentifier);

    return {
      success: true,
      ledgerEntryId: ledgerEntry.id,
      creditsDeposited: creditAmount,
      newBalance: balance.balance,
    };
  } catch (error: any) {
    console.error('Error depositing subscription credits:', error);
    return {
      success: false,
      creditsDeposited: 0,
      newBalance: 0,
      error: error.message || 'Unknown error',
    };
  }
}

