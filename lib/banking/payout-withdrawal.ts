import { createClient } from '@/lib/supabase/server';
import type { PayoutWithdrawalResult } from './types';
import { ensureCollectorAccount } from './account-manager';

/**
 * Record payout withdrawal when a payout is processed
 * This creates a ledger entry with transaction_type='payout_withdrawal' and currency='USD'
 */
export async function recordPayoutWithdrawal(
  vendorName: string,
  payoutId: number,
  withdrawalAmount: number,
  supabase?: ReturnType<typeof createClient>
): Promise<PayoutWithdrawalResult> {
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
        usdWithdrawn: 0,
        newUsdBalance: 0,
        error: `Vendor not found: ${vendorName}`,
      };
    }

    // Use auth_id as collector identifier (as established in the banking system)
    const collectorIdentifier = vendor.auth_id || vendorName;
    if (!collectorIdentifier) {
      return {
        success: false,
        usdWithdrawn: 0,
        newUsdBalance: 0,
        error: 'Vendor does not have an auth_id',
      };
    }

    // Ensure collector account exists
    await ensureCollectorAccount(collectorIdentifier, 'vendor', vendor.id);

    // Check if withdrawal already recorded for this payout (prevent duplicates)
    const { data: existingEntry, error: checkError } = await client
      .from('collector_ledger_entries')
      .select('id')
      .eq('collector_identifier', collectorIdentifier)
      .eq('payout_id', payoutId)
      .eq('transaction_type', 'payout_withdrawal')
      .eq('currency', 'USD')
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing payout withdrawal:', checkError);
    }

    if (existingEntry) {
      // Already recorded, return existing balance
      const { data: balanceData } = await client.rpc('get_collector_usd_balance', {
        p_collector_identifier: collectorIdentifier,
      });
      return {
        success: true,
        ledgerEntryId: existingEntry.id,
        usdWithdrawn: 0,
        newUsdBalance: Math.max(0, Number(balanceData) || 0),
        error: 'Payout withdrawal already recorded for this payout',
      };
    }

    // Get payout details for metadata
    const { data: payout } = await client
      .from('vendor_payouts')
      .select('reference, amount, currency, payout_date')
      .eq('id', payoutId)
      .single();

    // Create ledger entry for payout withdrawal (negative amount)
    const currentYear = new Date().getFullYear();
    const { data: ledgerEntry, error: ledgerError } = await client
      .from('collector_ledger_entries')
      .insert({
        collector_identifier: collectorIdentifier,
        transaction_type: 'payout_withdrawal',
        amount: -Math.abs(withdrawalAmount), // Negative amount for withdrawal
        currency: 'USD',
        payout_id: payoutId,
        description: `Payout withdrawal: ${payout?.reference || `PAYOUT-${payoutId}`}`,
        metadata: {
          vendor_name: vendorName,
          payout_reference: payout?.reference || null,
          payout_amount: payout?.amount || withdrawalAmount,
          payout_currency: payout?.currency || 'USD',
          payout_date: payout?.payout_date || new Date().toISOString(),
        },
        tax_year: currentYear,
        created_by: 'system',
      })
      .select('id')
      .single();

    if (ledgerError || !ledgerEntry) {
      console.error('Error creating payout withdrawal ledger entry:', ledgerError);
      return {
        success: false,
        usdWithdrawn: 0,
        newUsdBalance: 0,
        error: `Failed to create ledger entry: ${ledgerError?.message || 'Unknown error'}`,
      };
    }

    // Get new balance
    const { data: balanceData, error: balanceError } = await client.rpc('get_collector_usd_balance', {
      p_collector_identifier: collectorIdentifier,
    });

    if (balanceError) {
      console.error('Error getting USD balance:', balanceError);
    }

    return {
      success: true,
      ledgerEntryId: ledgerEntry.id,
      usdWithdrawn: withdrawalAmount,
      newUsdBalance: Math.max(0, Number(balanceData) || 0),
    };
  } catch (error: any) {
    console.error('Error in recordPayoutWithdrawal:', error);
    return {
      success: false,
      usdWithdrawn: 0,
      newUsdBalance: 0,
      error: error.message || 'Unknown error occurred',
    };
  }
}

