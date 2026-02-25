import { createClient } from '@/lib/supabase/server';
import { ensureCollectorAccount } from './account-manager';
import { invalidateVendorBalanceCache } from '@/lib/vendor-balance-calculator';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface RefundDeductionResult {
  success: boolean;
  ledgerEntryId?: number;
  amountDeducted: number;
  newUsdBalance: number;
  error?: string;
}

/**
 * Create a refund deduction entry in the ledger when an order is cancelled/refunded.
 * This offsets a prior `payout_earned` entry by creating a negative `refund_deduction` entry.
 *
 * Idempotent: if a refund_deduction already exists for this line_item_id, it returns
 * success without creating a duplicate.
 *
 * @param collectorIdentifier - The vendor's auth_id or vendor_name (ledger key)
 * @param lineItemId - The line item being refunded
 * @param amount - The positive amount to deduct (will be stored as negative)
 * @param supabase - Optional Supabase client
 * @param metadata - Optional additional metadata
 */
export async function createRefundDeduction(
  collectorIdentifier: string,
  lineItemId: string,
  amount: number,
  supabase?: SupabaseClient<any>,
  metadata?: Record<string, any>
): Promise<RefundDeductionResult> {
  const client = supabase || createClient();

  try {
    // Check if refund deduction already exists for this line item (idempotent)
    const { data: existingEntry, error: checkError } = await client
      .from('collector_ledger_entries')
      .select('id')
      .eq('collector_identifier', collectorIdentifier)
      .eq('line_item_id', lineItemId)
      .eq('transaction_type', 'refund_deduction')
      .eq('currency', 'USD')
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing refund deduction:', checkError);
    }

    if (existingEntry) {
      // Already deducted — return current balance
      const { data: balanceData } = await client.rpc('get_collector_usd_balance', {
        p_collector_identifier: collectorIdentifier,
      });
      return {
        success: true,
        ledgerEntryId: existingEntry.id,
        amountDeducted: 0,
        newUsdBalance: Math.max(0, Number(balanceData) || 0),
        error: 'Refund deduction already recorded for this line item',
      };
    }

    // Create the refund deduction ledger entry (negative amount)
    const currentYear = new Date().getFullYear();
    const { data: ledgerEntry, error: ledgerError } = await client
      .from('collector_ledger_entries')
      .insert({
        collector_identifier: collectorIdentifier,
        transaction_type: 'refund_deduction',
        amount: -Math.abs(amount), // Always negative
        currency: 'USD',
        line_item_id: lineItemId,
        description: `Refund deduction for cancelled/refunded line item ${lineItemId}`,
        metadata: {
          ...metadata,
          original_earned_amount: amount,
          reason: 'order_cancelled_or_refunded',
        },
        tax_year: currentYear,
        created_by: 'system',
      })
      .select('id')
      .single();

    if (ledgerError || !ledgerEntry) {
      console.error('Error creating refund deduction ledger entry:', ledgerError);
      return {
        success: false,
        amountDeducted: 0,
        newUsdBalance: 0,
        error: `Failed to create refund deduction: ${ledgerError?.message || 'Unknown error'}`,
      };
    }

    // Get new balance
    const { data: balanceData, error: balanceError } = await client.rpc('get_collector_usd_balance', {
      p_collector_identifier: collectorIdentifier,
    });

    if (balanceError) {
      console.error('Error getting USD balance after refund deduction:', balanceError);
    }

    console.log(
      `Refund deduction recorded: -$${amount} for line item ${lineItemId} (collector: ${collectorIdentifier})`
    );

    return {
      success: true,
      ledgerEntryId: ledgerEntry.id,
      amountDeducted: amount,
      newUsdBalance: Math.max(0, Number(balanceData) || 0),
    };
  } catch (error: any) {
    console.error('Error in createRefundDeduction:', error);
    return {
      success: false,
      amountDeducted: 0,
      newUsdBalance: 0,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Create refund deductions for a vendor by vendor name.
 * Resolves vendor → collectorIdentifier, then calls createRefundDeduction.
 * Also invalidates the vendor balance cache.
 */
export async function createRefundDeductionByVendor(
  vendorName: string,
  lineItemId: string,
  amount: number,
  supabase?: SupabaseClient<any>,
  metadata?: Record<string, any>
): Promise<RefundDeductionResult> {
  const client = supabase || createClient();

  try {
    // Resolve vendor → collector identifier
    const { data: vendor, error: vendorError } = await client
      .from('vendors')
      .select('id, auth_id, vendor_name')
      .eq('vendor_name', vendorName)
      .single();

    if (vendorError || !vendor) {
      return {
        success: false,
        amountDeducted: 0,
        newUsdBalance: 0,
        error: `Vendor not found: ${vendorName}`,
      };
    }

    const collectorIdentifier = vendor.auth_id || vendorName;

    // Ensure collector account exists
    await ensureCollectorAccount(collectorIdentifier, 'vendor', vendor.id);

    const result = await createRefundDeduction(
      collectorIdentifier,
      lineItemId,
      amount,
      client,
      { vendor_name: vendorName, ...metadata }
    );

    // Invalidate balance cache
    if (result.success && result.amountDeducted > 0) {
      invalidateVendorBalanceCache(vendorName);
    }

    return result;
  } catch (error: any) {
    console.error('Error in createRefundDeductionByVendor:', error);
    return {
      success: false,
      amountDeducted: 0,
      newUsdBalance: 0,
      error: error.message || 'Unknown error occurred',
    };
  }
}
