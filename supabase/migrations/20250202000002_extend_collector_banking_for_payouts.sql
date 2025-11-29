-- Migration to extend collector banking system for USD payout support
-- Adds currency field and new transaction types for payout earnings, withdrawals, and balance purchases

-- ============================================
-- PART 1: Add new transaction types to enum
-- ============================================

-- Add new transaction types for payout operations
DO $$
BEGIN
  -- Add payout_earned (USD deposited when line items are fulfilled)
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'payout_earned' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'collector_transaction_type')
  ) THEN
    ALTER TYPE collector_transaction_type ADD VALUE 'payout_earned';
  END IF;

  -- Add payout_withdrawal (USD withdrawn when payout is processed)
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'payout_withdrawal' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'collector_transaction_type')
  ) THEN
    ALTER TYPE collector_transaction_type ADD VALUE 'payout_withdrawal';
  END IF;

  -- Add payout_balance_purchase (USD spent from payout balance for store purchases)
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'payout_balance_purchase' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'collector_transaction_type')
  ) THEN
    ALTER TYPE collector_transaction_type ADD VALUE 'payout_balance_purchase';
  END IF;
END $$;

-- ============================================
-- PART 2: Add currency field to collector_ledger_entries
-- ============================================

-- Add currency column (defaults to 'CREDITS' for backward compatibility)
ALTER TABLE collector_ledger_entries
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'CREDITS' CHECK (currency IN ('CREDITS', 'USD'));

-- Create index on currency for faster queries
CREATE INDEX IF NOT EXISTS idx_collector_ledger_currency ON collector_ledger_entries(currency);

-- ============================================
-- PART 3: Add payout_id reference for tracking payout withdrawals
-- ============================================

-- Add payout_id column to link withdrawals to vendor_payouts
ALTER TABLE collector_ledger_entries
ADD COLUMN IF NOT EXISTS payout_id INTEGER REFERENCES vendor_payouts(id) ON DELETE SET NULL;

-- Create index on payout_id
CREATE INDEX IF NOT EXISTS idx_collector_ledger_payout_id ON collector_ledger_entries(payout_id);

-- ============================================
-- PART 4: Update helper functions to support currency
-- ============================================

-- Update get_collector_balance to support currency filtering
CREATE OR REPLACE FUNCTION get_collector_balance(p_collector_identifier TEXT, p_currency TEXT DEFAULT 'CREDITS')
RETURNS NUMERIC(10,2) AS $$
DECLARE
  v_balance NUMERIC(10,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_balance
  FROM collector_ledger_entries
  WHERE collector_identifier = p_collector_identifier
    AND currency = p_currency;
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to get USD balance
CREATE OR REPLACE FUNCTION get_collector_usd_balance(p_collector_identifier TEXT)
RETURNS NUMERIC(10,2) AS $$
BEGIN
  RETURN get_collector_balance(p_collector_identifier, 'USD');
END;
$$ LANGUAGE plpgsql;

-- Create function to get credits balance
CREATE OR REPLACE FUNCTION get_collector_credits_balance(p_collector_identifier TEXT)
RETURNS NUMERIC(10,2) AS $$
BEGIN
  RETURN get_collector_balance(p_collector_identifier, 'CREDITS');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 5: Create function to get unified balance (both credits and USD)
-- ============================================

CREATE OR REPLACE FUNCTION get_collector_unified_balance(p_collector_identifier TEXT)
RETURNS TABLE (
  credits_balance NUMERIC(10,2),
  usd_balance NUMERIC(10,2),
  total_credits_earned NUMERIC(10,2),
  total_usd_earned NUMERIC(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN currency = 'CREDITS' THEN amount ELSE 0 END), 0)::NUMERIC(10,2) as credits_balance,
    COALESCE(SUM(CASE WHEN currency = 'USD' THEN amount ELSE 0 END), 0)::NUMERIC(10,2) as usd_balance,
    COALESCE(SUM(CASE WHEN currency = 'CREDITS' AND amount > 0 AND transaction_type IN ('credit_earned', 'subscription_credit') THEN amount ELSE 0 END), 0)::NUMERIC(10,2) as total_credits_earned,
    COALESCE(SUM(CASE WHEN currency = 'USD' AND amount > 0 AND transaction_type = 'payout_earned' THEN amount ELSE 0 END), 0)::NUMERIC(10,2) as total_usd_earned
  FROM collector_ledger_entries
  WHERE collector_identifier = p_collector_identifier;
END;
$$ LANGUAGE plpgsql;

