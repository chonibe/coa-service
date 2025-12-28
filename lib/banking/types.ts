// Banking system types and constants

// Configuration constants
export const CREDITS_PER_DOLLAR = 10;
export const CREDIT_VALUE_USD = 0.01; // 1 credit = $0.01, so 100 credits = $1.00
export const LAMP_UNLOCK_THRESHOLD_USD = 255; // Must spend $255 to unlock free lamp
export const PROOF_PRINT_UNLOCK_THRESHOLD_USD = 24; // Must spend $24 to unlock free proof print
export const LAMP_COST_USD = 85; // $35 production + $50 delivery
export const PROOF_PRINT_COST_USD = 8; // Total cost including delivery

// Convert USD to credits
export const LAMP_UNLOCK_THRESHOLD_CREDITS = LAMP_UNLOCK_THRESHOLD_USD * CREDITS_PER_DOLLAR; // 2,550 credits
export const PROOF_PRINT_UNLOCK_THRESHOLD_CREDITS = PROOF_PRINT_UNLOCK_THRESHOLD_USD * CREDITS_PER_DOLLAR; // 240 credits

// Transaction types
export type CollectorTransactionType = 
  | 'credit_earned' 
  | 'subscription_credit' 
  | 'purchase' 
  | 'perk_redemption'
  | 'payout_earned'      // USD deposited when line items are fulfilled
  | 'payout_withdrawal'  // USD withdrawn when payout is processed
  | 'payout_balance_purchase' // USD spent from payout balance for store purchases
  | 'refund_deduction'   // USD deducted for refunds
  | 'adjustment'         // Manual balance adjustments
  | 'platform_fee';      // Platform fees or commissions

// Account types
export type CollectorAccountType = 'customer' | 'vendor';

// Account status
export type CollectorAccountStatus = 'active' | 'inactive';

// Perk types
export type CollectorPerkType = 'lamp' | 'proof_print';

// Redemption status
export type CollectorRedemptionStatus = 'pending' | 'fulfilled' | 'cancelled';

// Subscription status
export type CollectorSubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';

// Currency types
export type CollectorCurrency = 'CREDITS' | 'USD';

// Balance information
export interface CollectorBalance {
  balance: number; // Current balance in credits
  creditsEarned: number; // Total credits ever earned
  creditsSpent: number; // Total credits ever spent
}

// Unified balance (both credits and USD)
export interface UnifiedCollectorBalance {
  creditsBalance: number; // Current balance in credits
  usdBalance: number; // Current balance in USD (payout balance)
  totalCreditsEarned: number; // Total credits ever earned
  totalUsdEarned: number; // Total USD ever earned from payouts
}

// Perk unlock status
export interface PerkUnlockStatus {
  lamp: {
    unlocked: boolean;
    progress: number; // Percentage (0-100)
    creditsEarned: number;
    threshold: number;
  };
  proofPrint: {
    unlocked: boolean;
    progress: number; // Percentage (0-100)
    creditsEarned: number;
    threshold: number;
  };
}

// Account information
export interface CollectorAccount {
  id: string;
  collectorIdentifier: string;
  accountType: CollectorAccountType;
  vendorId?: number;
  accountStatus: CollectorAccountStatus;
  createdAt: string;
  updatedAt: string;
}

// Ledger entry
export interface CollectorLedgerEntry {
  id: number;
  collectorIdentifier: string;
  transactionType: CollectorTransactionType;
  amount: number;
  currency: CollectorCurrency; // 'CREDITS' or 'USD'
  orderId?: string;
  lineItemId?: string;
  subscriptionId?: string;
  purchaseId?: string;
  perkRedemptionId?: string;
  payoutId?: number; // Reference to vendor_payouts.id for payout_withdrawal transactions
  description?: string;
  metadata?: Record<string, any>;
  taxYear?: number;
  createdAt: string;
  createdBy: string;
}

// Perk redemption
export interface CollectorPerkRedemption {
  id: string;
  collectorIdentifier: string;
  perkType: CollectorPerkType;
  productSku?: string;
  artworkSubmissionId?: string;
  unlockedAt?: string;
  totalCreditsEarnedAtUnlock?: number;
  redemptionStatus: CollectorRedemptionStatus;
  ledgerEntryId?: number;
  createdAt: string;
  updatedAt: string;
}

// Credit subscription
export interface CollectorCreditSubscription {
  id: string;
  collectorIdentifier: string;
  subscriptionStatus: CollectorSubscriptionStatus;
  monthlyCreditAmount: number;
  subscriptionTier?: string;
  billingAmountUsd: number;
  paymentMethod: string;
  paymentSubscriptionId?: string;
  startedAt: string;
  nextBillingDate: string;
  lastCreditedAt?: string;
  pausedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Credit deposit result
export interface CreditDepositResult {
  success: boolean;
  ledgerEntryId?: number;
  creditsDeposited: number;
  newBalance: number;
  error?: string;
}

// Credit payment result
export interface CreditPaymentResult {
  success: boolean;
  ledgerEntryId?: number;
  creditsUsed: number;
  newBalance: number;
  error?: string;
}

// Perk redemption result
export interface PerkRedemptionResult {
  success: boolean;
  redemptionId?: string;
  unlocked: boolean;
  creditsEarnedAtUnlock?: number;
  error?: string;
}

// Payout deposit result
export interface PayoutDepositResult {
  success: boolean;
  ledgerEntryId?: number;
  usdDeposited: number;
  newUsdBalance: number;
  error?: string;
}

// Payout withdrawal result
export interface PayoutWithdrawalResult {
  success: boolean;
  ledgerEntryId?: number;
  usdWithdrawn: number;
  newUsdBalance: number;
  error?: string;
}

