import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { calculateUnifiedCollectorBalance } from './balance-calculator';
import type { UnifiedCollectorBalance, CollectorLedgerEntry } from './types';

/**
 * Unified Banking Service
 * The single entry point for all financial operations in the system.
 * Enforces ledger-based calculations and professional auditing standards.
 */
export class UnifiedBankingService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase?: SupabaseClient<Database>) {
    this.supabase = supabase || createClient();
  }

  /**
   * Get unified balance for a collector (Credits + USD)
   * Always derived from the immutable ledger.
   */
  async getBalance(collectorIdentifier: string): Promise<UnifiedCollectorBalance> {
    return calculateUnifiedCollectorBalance(collectorIdentifier);
  }

  /**
   * Get all vendors with their current balances and metadata.
   * Useful for admin payout management.
   */
  async getAllVendorBalances() {
    const { data: vendors, error: vendorError } = await this.supabase
      .from('vendors')
      .select('id, vendor_name, auth_id, paypal_email, tax_id, tax_country, is_company');

    if (vendorError) {
      console.error('Error fetching vendors for balances:', vendorError);
      throw vendorError;
    }

    const balances = await Promise.all(
      vendors.map(async (vendor) => {
        const identifier = vendor.auth_id || vendor.vendor_name;
        const balance = await this.getBalance(identifier);
        
        // Get last payout date from vendor_payouts
        const { data: lastPayout } = await this.supabase
          .from('vendor_payouts')
          .select('payout_date')
          .eq('vendor_name', vendor.vendor_name)
          .eq('status', 'completed')
          .order('payout_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          vendor_name: vendor.vendor_name,
          amount: balance.usdBalance, // Available for withdrawal
          credits_balance: balance.creditsBalance,
          total_usd_earned: balance.totalUsdEarned,
          total_credits_earned: balance.totalCreditsEarned,
          paypal_email: vendor.paypal_email,
          tax_id: vendor.tax_id,
          tax_country: vendor.tax_country,
          is_company: vendor.is_company,
          last_payout_date: lastPayout?.payout_date || null
        };
      })
    );

    return balances.sort((a, b) => b.amount - a.amount);
  }

  /**
   * Record a financial transaction in the ledger.
   * This is the only way to move money in the system.
   */
  async recordTransaction(entry: {
    collectorIdentifier: string;
    transactionType: any; // Use the type from lib/banking/types.ts
    amount: number;
    currency: 'USD' | 'CREDITS';
    description: string;
    createdBy: string;
    orderId?: string;
    lineItemId?: string;
    payoutId?: number;
    metadata?: any;
  }) {
    const currentYear = new Date().getFullYear();
    
    const { data, error } = await this.supabase
      .from('collector_ledger_entries')
      .insert({
        collector_identifier: entry.collectorIdentifier,
        transaction_type: entry.transactionType,
        amount: entry.amount,
        currency: entry.currency,
        order_id: entry.orderId,
        line_item_id: entry.lineItemId,
        payout_id: entry.payoutId,
        description: entry.description,
        metadata: entry.metadata || {},
        tax_year: currentYear,
        created_by: entry.createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording ledger transaction:', error);
      throw error;
    }

    return data;
  }

  /**
   * Record a manual adjustment (e.g., correction, bonus).
   */
  async recordAdjustment(params: {
    collectorIdentifier: string;
    amount: number;
    currency: 'USD' | 'CREDITS';
    description: string;
    createdBy: string;
    metadata?: any;
  }) {
    return this.recordTransaction({
      ...params,
      transactionType: 'adjustment',
    });
  }

  /**
   * Record a refund deduction.
   */
  async recordRefundDeduction(params: {
    collectorIdentifier: string;
    amount: number;
    orderId: string;
    lineItemId: string;
    description: string;
    createdBy: string;
    metadata?: any;
  }) {
    return this.recordTransaction({
      ...params,
      transactionType: 'refund_deduction',
      currency: 'USD',
      amount: -Math.abs(params.amount), // Ensure negative
    });
  }

  /**
   * Verify platform financial integrity.
   * Compares total completed payouts against total ledger withdrawals.
   * Returns a drift amount (ideally 0.00).
   */
  async verifyPlatformIntegrity() {
    // 1. Sum of all completed payouts
    const { data: payoutSum, error: payoutError } = await this.supabase
      .from('vendor_payouts')
      .select('amount')
      .eq('status', 'completed');

    if (payoutError) throw payoutError;

    const totalPayouts = payoutSum?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

    // 2. Sum of all ledger withdrawals
    const { data: ledgerSum, error: ledgerError } = await this.supabase
      .from('collector_ledger_entries')
      .select('amount')
      .eq('transaction_type', 'payout_withdrawal')
      .eq('currency', 'USD');

    if (ledgerError) throw ledgerError;

    const totalWithdrawals = Math.abs(ledgerSum?.reduce((sum, l) => sum + Number(l.amount || 0), 0) || 0);

    const drift = Number((totalPayouts - totalWithdrawals).toFixed(2));

    // 3. Find specific missing payout IDs (optional but helpful)
    const { data: vp } = await this.supabase.from('vendor_payouts').select('id').eq('status', 'completed');
    const { data: cle } = await this.supabase.from('collector_ledger_entries').select('payout_id').eq('transaction_type', 'payout_withdrawal');
    const ledgerPayoutIds = new Set(cle?.map(l => l.payout_id).filter(Boolean));
    const missingCount = vp?.filter(p => !ledgerPayoutIds.has(p.id)).length || 0;

    return {
      totalPayouts,
      totalWithdrawals,
      drift,
      missingCount,
      isHealthy: Math.abs(drift) < 0.01 && missingCount === 0,
      lastChecked: new Date().toISOString()
    };
  }
}

