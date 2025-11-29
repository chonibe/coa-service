import { createClient } from '@/lib/supabase/server';
import { calculateCollectorBalance } from './balance-calculator';
import type { CreditPaymentResult } from './types';

/**
 * Process credit payment for a purchase
 * Validates balance and creates ledger entry
 * 
 * @param collectorIdentifier - Collector identifier
 * @param amount - Amount to pay in credits
 * @param purchaseId - Purchase ID (optional)
 * @param description - Transaction description
 */
export async function processCreditPayment(
  collectorIdentifier: string,
  amount: number,
  purchaseId?: string,
  description?: string
): Promise<CreditPaymentResult> {
  const supabase = createClient();

  try {
    if (amount <= 0) {
      return {
        success: false,
        creditsUsed: 0,
        newBalance: 0,
        error: 'Invalid payment amount',
      };
    }

    // Get current balance
    const balance = await calculateCollectorBalance(collectorIdentifier);

    if (balance.balance < amount) {
      return {
        success: false,
        creditsUsed: 0,
        newBalance: balance.balance,
        error: `Insufficient credits. Available: ${balance.balance}, Required: ${amount}`,
      };
    }

    // Create ledger entry (negative amount for payment)
    const { data: ledgerEntry, error: ledgerError } = await supabase
      .from('collector_ledger_entries')
      .insert({
        collector_identifier: collectorIdentifier,
        transaction_type: 'purchase',
        amount: -amount, // Negative for payment
        purchase_id: purchaseId || null,
        description: description || `Credit payment: ${amount} credits`,
        created_by: 'system',
        metadata: {
          purchase_id: purchaseId,
          amount_credits: amount,
        },
      })
      .select()
      .single();

    if (ledgerError || !ledgerEntry) {
      console.error('Error creating payment ledger entry:', ledgerError);
      return {
        success: false,
        creditsUsed: 0,
        newBalance: balance.balance,
        error: `Failed to create ledger entry: ${ledgerError?.message || 'Unknown error'}`,
      };
    }

    // Calculate new balance
    const newBalance = await calculateCollectorBalance(collectorIdentifier);

    return {
      success: true,
      ledgerEntryId: ledgerEntry.id,
      creditsUsed: amount,
      newBalance: newBalance.balance,
    };
  } catch (error: any) {
    console.error('Error processing credit payment:', error);
    return {
      success: false,
      creditsUsed: 0,
      newBalance: 0,
      error: error.message || 'Unknown error',
    };
  }
}

