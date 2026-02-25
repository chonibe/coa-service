import { createClient } from '@/lib/supabase/server';
import { ensureCollectorAccount } from './account-manager';

export interface PayoutReversalResult {
  success: boolean;
  ledgerEntryId?: number;
  amountReversed: number;
  newUsdBalance: number;
  error?: string;
}

/**
 * Reverse a payout withdrawal when a payout is rejected or fails.
 * Creates a positive ledger entry with transaction_type='payout_reversal' to restore the vendor's balance.
 * Idempotent: if a reversal already exists for this payout_id, it returns success without creating a duplicate.
 */
export async function reversePayoutWithdrawal(
  vendorName: string,
  payoutId: number,
  amount: number,
  supabase?: ReturnType<typeof createClient>
): Promise<PayoutReversalResult> {
  const client = supabase || createClient();

  try {
    // Get vendor info to find collector identifier
    const { data: vendor, error: vendorError } = await client
      .from('vendors')
      .select('id, auth_id, vendor_name')
      .eq('vendor_name', vendorName)
      .single();

    if (vendorError || !vendor) {
      return {
        success: false,
        amountReversed: 0,
        newUsdBalance: 0,
        error: `Vendor not found: ${vendorName}`,
      };
    }

    const collectorIdentifier = vendor.auth_id || vendorName;
    if (!collectorIdentifier) {
      return {
        success: false,
        amountReversed: 0,
        newUsdBalance: 0,
        error: 'Vendor does not have an auth_id',
      };
    }

    // Ensure collector account exists
    await ensureCollectorAccount(collectorIdentifier, 'vendor', vendor.id);

    // Check if a reversal already exists for this payout (idempotent)
    const { data: existingReversal, error: checkError } = await client
      .from('collector_ledger_entries')
      .select('id')
      .eq('collector_identifier', collectorIdentifier)
      .eq('payout_id', payoutId)
      .eq('transaction_type', 'payout_reversal')
      .eq('currency', 'USD')
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing payout reversal:', checkError);
    }

    if (existingReversal) {
      // Already reversed, return existing balance
      const { data: balanceData } = await client.rpc('get_collector_usd_balance', {
        p_collector_identifier: collectorIdentifier,
      });
      return {
        success: true,
        ledgerEntryId: existingReversal.id,
        amountReversed: 0,
        newUsdBalance: Math.max(0, Number(balanceData) || 0),
        error: 'Payout reversal already recorded for this payout',
      };
    }

    // Also check: was there actually a withdrawal for this payout?
    // If there was no withdrawal, there's nothing to reverse — but we still allow
    // the reversal to be created so the balance is corrected regardless.
    const { data: existingWithdrawal } = await client
      .from('collector_ledger_entries')
      .select('id')
      .eq('collector_identifier', collectorIdentifier)
      .eq('payout_id', payoutId)
      .eq('transaction_type', 'payout_withdrawal')
      .eq('currency', 'USD')
      .maybeSingle();

    if (!existingWithdrawal) {
      console.log(`No withdrawal found for payout ${payoutId} — reversal will still be created for safety`);
    }

    // Create ledger entry for payout reversal (positive amount restores balance)
    const currentYear = new Date().getFullYear();
    const { data: ledgerEntry, error: ledgerError } = await client
      .from('collector_ledger_entries')
      .insert({
        collector_identifier: collectorIdentifier,
        transaction_type: 'payout_reversal',
        amount: Math.abs(amount), // Positive amount to restore balance
        currency: 'USD',
        payout_id: payoutId,
        description: `Payout reversal for rejected/failed payout #${payoutId}`,
        metadata: {
          vendor_name: vendorName,
          original_payout_id: payoutId,
          reversal_amount: amount,
          reason: 'payout_rejected_or_failed',
        },
        tax_year: currentYear,
        created_by: 'system',
      })
      .select('id')
      .single();

    if (ledgerError || !ledgerEntry) {
      console.error('Error creating payout reversal ledger entry:', ledgerError);
      return {
        success: false,
        amountReversed: 0,
        newUsdBalance: 0,
        error: `Failed to create reversal ledger entry: ${ledgerError?.message || 'Unknown error'}`,
      };
    }

    // Get new balance
    const { data: balanceData, error: balanceError } = await client.rpc('get_collector_usd_balance', {
      p_collector_identifier: collectorIdentifier,
    });

    if (balanceError) {
      console.error('Error getting USD balance after reversal:', balanceError);
    }

    console.log(`Payout reversal recorded for ${vendorName}: +$${amount} restored (payout #${payoutId})`);

    return {
      success: true,
      ledgerEntryId: ledgerEntry.id,
      amountReversed: amount,
      newUsdBalance: Math.max(0, Number(balanceData) || 0),
    };
  } catch (error: any) {
    console.error('Error in reversePayoutWithdrawal:', error);
    return {
      success: false,
      amountReversed: 0,
      newUsdBalance: 0,
      error: error.message || 'Unknown error occurred',
    };
  }
}
