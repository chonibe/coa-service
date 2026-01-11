import { createClient } from '@/lib/supabase/server';
import { getOrCreateCollectorAccount } from './account-manager';
import { calculateCollectorBalance } from './balance-calculator';
import type { CreditDepositResult, CollectorAccountType } from './types';

/**
 * Reward credits for an NFC scan
 */
export async function rewardCreditsForNfcScan(
  collectorIdentifier: string,
  tagId: string,
  lineItemId: string,
  orderId: string,
  accountType: CollectorAccountType = 'customer'
): Promise<CreditDepositResult> {
  const supabase = createClient();
  const REWARD_AMOUNT = 500;

  try {
    await getOrCreateCollectorAccount(collectorIdentifier, accountType);

    // Check for duplicate reward
    const { data: existing } = await supabase
      .from('collector_ledger_entries')
      .select('id')
      .eq('collector_identifier', collectorIdentifier)
      .eq('transaction_type', 'nfc_scan_reward')
      .eq('line_item_id', lineItemId)
      .maybeSingle();

    if (existing) {
      const balance = await calculateCollectorBalance(collectorIdentifier);
      return {
        success: true,
        ledgerEntryId: existing.id,
        creditsDeposited: 0,
        newBalance: balance.balance,
      };
    }

    const { data: ledgerEntry, error: ledgerError } = await supabase
      .from('collector_ledger_entries')
      .insert({
        collector_identifier: collectorIdentifier,
        transaction_type: 'nfc_scan_reward' as any,
        amount: REWARD_AMOUNT,
        order_id: orderId,
        line_item_id: lineItemId,
        description: `Credits rewarded for NFC scan authentication`,
        created_by: 'system',
        metadata: {
          tag_id: tagId,
          line_item_id: lineItemId,
          order_id: orderId,
        },
      })
      .select()
      .single();

    if (ledgerError || !ledgerEntry) {
      throw new Error(`Failed to create ledger entry: ${ledgerError?.message}`);
    }

    const balance = await calculateCollectorBalance(collectorIdentifier);

    return {
      success: true,
      ledgerEntryId: ledgerEntry.id,
      creditsDeposited: REWARD_AMOUNT,
      newBalance: balance.balance,
    };
  } catch (error: any) {
    console.error('Error rewarding NFC scan credits:', error);
    return {
      success: false,
      creditsDeposited: 0,
      newBalance: 0,
      error: error.message,
    };
  }
}

/**
 * Reward credits for completing a series
 */
export async function rewardCreditsForSeriesCompletion(
  collectorIdentifier: string,
  seriesId: string,
  accountType: CollectorAccountType = 'customer'
): Promise<CreditDepositResult> {
  const supabase = createClient();
  const REWARD_AMOUNT = 1000;

  try {
    await getOrCreateCollectorAccount(collectorIdentifier, accountType);

    // Check for duplicate reward
    const { data: existing } = await supabase
      .from('collector_ledger_entries')
      .select('id')
      .eq('collector_identifier', collectorIdentifier)
      .eq('transaction_type', 'series_completion_reward' as any)
      .eq('metadata->>series_id', seriesId)
      .maybeSingle();

    if (existing) {
      const balance = await calculateCollectorBalance(collectorIdentifier);
      return {
        success: true,
        ledgerEntryId: existing.id,
        creditsDeposited: 0,
        newBalance: balance.balance,
      };
    }

    const { data: ledgerEntry, error: ledgerError } = await supabase
      .from('collector_ledger_entries')
      .insert({
        collector_identifier: collectorIdentifier,
        transaction_type: 'series_completion_reward' as any,
        amount: REWARD_AMOUNT,
        description: `Credits rewarded for series completion`,
        created_by: 'system',
        metadata: {
          series_id: seriesId,
        },
      })
      .select()
      .single();

    if (ledgerError || !ledgerEntry) {
      throw new Error(`Failed to create ledger entry: ${ledgerError?.message}`);
    }

    const balance = await calculateCollectorBalance(collectorIdentifier);

    return {
      success: true,
      ledgerEntryId: ledgerEntry.id,
      creditsDeposited: REWARD_AMOUNT,
      newBalance: balance.balance,
    };
  } catch (error: any) {
    console.error('Error rewarding series completion credits:', error);
    return {
      success: false,
      creditsDeposited: 0,
      newBalance: 0,
      error: error.message,
    };
  }
}

