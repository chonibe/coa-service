import { createClient } from '@/lib/supabase/server';
import type { CollectorBalance, UnifiedCollectorBalance } from './types';

/**
 * Calculate current balance from ledger entries (source of truth)
 * No snapshot field - always calculate from ledger
 * Only calculates credits balance (for backward compatibility)
 */
export async function calculateCollectorBalance(
  collectorIdentifier: string
): Promise<CollectorBalance> {
  const supabase = createClient();

  // Get all ledger entries for this collector (credits only)
  const { data: entries, error } = await supabase
    .from('collector_ledger_entries')
    .select('amount, transaction_type')
    .eq('collector_identifier', collectorIdentifier)
    .eq('currency', 'CREDITS');

  if (error) {
    console.error('Error calculating balance:', error);
    throw new Error(`Failed to calculate balance: ${error.message}`);
  }

  let balance = 0;
  let creditsEarned = 0;
  let creditsSpent = 0;

  entries?.forEach((entry) => {
    const amount = Number(entry.amount) || 0;
    balance += amount;

    if (amount > 0) {
      // Positive amounts are credits earned
      if (entry.transaction_type === 'credit_earned' || entry.transaction_type === 'subscription_credit') {
        creditsEarned += amount;
      }
    } else {
      // Negative amounts are credits spent
      creditsSpent += Math.abs(amount);
    }
  });

  return {
    balance: Math.max(0, balance), // Balance should never go negative
    creditsEarned,
    creditsSpent,
  };
}

/**
 * Calculate unified balance (both credits and USD) from ledger entries
 * This is the main function for getting complete account balance
 */
export async function calculateUnifiedCollectorBalance(
  collectorIdentifier: string
): Promise<UnifiedCollectorBalance> {
  const supabase = createClient();

  // Get all ledger entries for this collector
  const { data: entries, error } = await supabase
    .from('collector_ledger_entries')
    .select('amount, transaction_type, currency')
    .eq('collector_identifier', collectorIdentifier);

  if (error) {
    console.error('Error calculating unified balance:', error);
    throw new Error(`Failed to calculate unified balance: ${error.message}`);
  }

  let creditsBalance = 0;
  let usdBalance = 0;
  let totalCreditsEarned = 0;
  let totalUsdEarned = 0;

  entries?.forEach((entry) => {
    const amount = Number(entry.amount) || 0;
    const currency = entry.currency || 'CREDITS';

    if (currency === 'CREDITS') {
      creditsBalance += amount;
      if (amount > 0 && (entry.transaction_type === 'credit_earned' || entry.transaction_type === 'subscription_credit')) {
        totalCreditsEarned += amount;
      }
    } else if (currency === 'USD') {
      usdBalance += amount;
      if (amount > 0 && entry.transaction_type === 'payout_earned') {
        totalUsdEarned += amount;
      }
    }
  });

  return {
    creditsBalance: Math.max(0, creditsBalance), // Credits balance should never go negative
    usdBalance: Math.max(0, usdBalance), // USD balance should never go negative
    totalCreditsEarned,
    totalUsdEarned,
  };
}

/**
 * Get total credits earned (for unlock threshold checking)
 * Only counts credit_earned and subscription_credit transactions
 */
export async function getTotalCreditsEarned(
  collectorIdentifier: string
): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('collector_ledger_entries')
    .select('amount')
    .eq('collector_identifier', collectorIdentifier)
    .eq('currency', 'CREDITS')
    .in('transaction_type', ['credit_earned', 'subscription_credit']);

  if (error) {
    console.error('Error getting total credits earned:', error);
    throw new Error(`Failed to get total credits earned: ${error.message}`);
  }

  const total = data?.reduce((sum, entry) => {
    const amount = Number(entry.amount) || 0;
    return sum + (amount > 0 ? amount : 0);
  }, 0) || 0;

  return total;
}

/**
 * Get USD balance (payout balance available for withdrawal or store purchases)
 */
export async function getUsdBalance(
  collectorIdentifier: string
): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_collector_usd_balance', {
    p_collector_identifier: collectorIdentifier,
  });

  if (error) {
    console.error('Error getting USD balance:', error);
    throw new Error(`Failed to get USD balance: ${error.message}`);
  }

  return Math.max(0, Number(data) || 0);
}

