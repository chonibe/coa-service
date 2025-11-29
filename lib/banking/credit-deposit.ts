import { createClient } from '@/lib/supabase/server';
import { CREDITS_PER_DOLLAR } from './types';
import { getOrCreateCollectorAccount } from './account-manager';
import { calculateCollectorBalance } from './balance-calculator';
import type { CreditDepositResult, CollectorAccountType } from './types';

/**
 * Deposit credits when order line item is fulfilled
 * Calculates: credits = (line_item_price × CREDITS_PER_DOLLAR)
 * 
 * @param collectorIdentifier - account_number or customer_id
 * @param orderId - Order ID
 * @param lineItemId - Line item ID
 * @param lineItemPrice - Price of the line item in USD
 * @param accountType - 'customer' or 'vendor'
 * @param vendorId - Optional vendor ID if vendor is the collector
 */
export async function depositCreditsFromPurchase(
  collectorIdentifier: string,
  orderId: string,
  lineItemId: string,
  lineItemPrice: number,
  accountType: CollectorAccountType,
  vendorId?: number
): Promise<CreditDepositResult> {
  const supabase = createClient();

  try {
    // Ensure account exists
    await getOrCreateCollectorAccount(collectorIdentifier, accountType, vendorId);

    // Calculate credits to deposit (10 credits per $1)
    const creditsToDeposit = Math.round(lineItemPrice * CREDITS_PER_DOLLAR);

    if (creditsToDeposit <= 0) {
      return {
        success: false,
        creditsDeposited: 0,
        newBalance: 0,
        error: 'Invalid line item price',
      };
    }

    // Check for duplicate deposit (prevent double-crediting)
    const { data: existing } = await supabase
      .from('collector_ledger_entries')
      .select('id')
      .eq('collector_identifier', collectorIdentifier)
      .eq('transaction_type', 'credit_earned')
      .eq('line_item_id', lineItemId)
      .single();

    if (existing) {
      // Already credited, return current balance
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
        transaction_type: 'credit_earned',
        amount: creditsToDeposit,
        order_id: orderId,
        line_item_id: lineItemId,
        description: `Credits earned from purchase: $${lineItemPrice.toFixed(2)}`,
        created_by: 'system',
        metadata: {
          order_id: orderId,
          line_item_id: lineItemId,
          price_usd: lineItemPrice,
          credits_per_dollar: CREDITS_PER_DOLLAR,
        },
      })
      .select()
      .single();

    if (ledgerError || !ledgerEntry) {
      console.error('Error creating ledger entry:', ledgerError);
      return {
        success: false,
        creditsDeposited: 0,
        newBalance: 0,
        error: `Failed to create ledger entry: ${ledgerError?.message || 'Unknown error'}`,
      };
    }

    // Calculate new balance
    const balance = await calculateCollectorBalance(collectorIdentifier);

    return {
      success: true,
      ledgerEntryId: ledgerEntry.id,
      creditsDeposited: creditsToDeposit,
      newBalance: balance.balance,
    };
  } catch (error: any) {
    console.error('Error depositing credits:', error);
    return {
      success: false,
      creditsDeposited: 0,
      newBalance: 0,
      error: error.message || 'Unknown error',
    };
  }
}

