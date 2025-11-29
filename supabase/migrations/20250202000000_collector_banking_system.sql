-- Migration for Collector Banking & Credit System
-- Creates tables for collector accounts, ledger entries, perk redemptions, and credit subscriptions
-- Designed as a banking system with ledger-based balance calculation

-- ============================================
-- PART 1: Create ENUM types
-- ============================================

-- Account type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collector_account_type') THEN
    CREATE TYPE collector_account_type AS ENUM ('customer', 'vendor');
  END IF;
END $$;

-- Account status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collector_account_status') THEN
    CREATE TYPE collector_account_status AS ENUM ('active', 'inactive');
  END IF;
END $$;

-- Transaction type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collector_transaction_type') THEN
    CREATE TYPE collector_transaction_type AS ENUM ('credit_earned', 'subscription_credit', 'purchase', 'perk_redemption');
  END IF;
END $$;

-- Perk type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collector_perk_type') THEN
    CREATE TYPE collector_perk_type AS ENUM ('lamp', 'proof_print');
  END IF;
END $$;

-- Redemption status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collector_redemption_status') THEN
    CREATE TYPE collector_redemption_status AS ENUM ('pending', 'fulfilled', 'cancelled');
  END IF;
END $$;

-- Subscription status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collector_subscription_status') THEN
    CREATE TYPE collector_subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');
  END IF;
END $$;

-- ============================================
-- PART 2: Create collector_accounts table
-- ============================================

CREATE TABLE IF NOT EXISTS collector_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_identifier TEXT NOT NULL UNIQUE,
  account_type collector_account_type NOT NULL,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
  account_status collector_account_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for collector_accounts
CREATE INDEX IF NOT EXISTS idx_collector_accounts_identifier ON collector_accounts(collector_identifier);
CREATE INDEX IF NOT EXISTS idx_collector_accounts_vendor_id ON collector_accounts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_collector_accounts_status ON collector_accounts(account_status);

-- ============================================
-- PART 3: Create collector_ledger_entries table
-- ============================================

CREATE TABLE IF NOT EXISTS collector_ledger_entries (
  id SERIAL PRIMARY KEY,
  collector_identifier TEXT NOT NULL,
  transaction_type collector_transaction_type NOT NULL,
  amount NUMERIC(10,2) NOT NULL, -- positive for credits earned, negative for credits spent
  order_id TEXT, -- for credit_earned transactions
  line_item_id TEXT, -- for credit_earned transactions
  subscription_id UUID REFERENCES collector_credit_subscriptions(id) ON DELETE SET NULL, -- for subscription_credit
  purchase_id UUID REFERENCES vendor_store_purchases(id) ON DELETE SET NULL, -- for purchases
  perk_redemption_id UUID REFERENCES collector_perk_redemptions(id) ON DELETE SET NULL, -- for perk redemptions
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'system' -- system, admin, or user identifier
);

-- Create indexes for collector_ledger_entries
CREATE INDEX IF NOT EXISTS idx_collector_ledger_identifier ON collector_ledger_entries(collector_identifier);
CREATE INDEX IF NOT EXISTS idx_collector_ledger_type ON collector_ledger_entries(transaction_type);
CREATE INDEX IF NOT EXISTS idx_collector_ledger_order_id ON collector_ledger_entries(order_id);
CREATE INDEX IF NOT EXISTS idx_collector_ledger_line_item_id ON collector_ledger_entries(line_item_id);
CREATE INDEX IF NOT EXISTS idx_collector_ledger_subscription_id ON collector_ledger_entries(subscription_id);
CREATE INDEX IF NOT EXISTS idx_collector_ledger_purchase_id ON collector_ledger_entries(purchase_id);
CREATE INDEX IF NOT EXISTS idx_collector_ledger_perk_redemption_id ON collector_ledger_entries(perk_redemption_id);
CREATE INDEX IF NOT EXISTS idx_collector_ledger_created_at ON collector_ledger_entries(created_at DESC);

-- ============================================
-- PART 4: Create collector_perk_redemptions table
-- ============================================

CREATE TABLE IF NOT EXISTS collector_perk_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_identifier TEXT NOT NULL,
  perk_type collector_perk_type NOT NULL,
  product_sku TEXT, -- for lamps
  artwork_submission_id UUID REFERENCES vendor_product_submissions(id) ON DELETE SET NULL, -- for proof prints
  unlocked_at TIMESTAMP WITH TIME ZONE, -- when unlock threshold was met (checked on redemption)
  total_credits_earned_at_unlock NUMERIC(10,2), -- total credits earned when unlocked
  redemption_status collector_redemption_status NOT NULL DEFAULT 'pending',
  ledger_entry_id INTEGER REFERENCES collector_ledger_entries(id) ON DELETE SET NULL, -- usually 0 for free perks
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for collector_perk_redemptions
CREATE INDEX IF NOT EXISTS idx_collector_perk_redemptions_identifier ON collector_perk_redemptions(collector_identifier);
CREATE INDEX IF NOT EXISTS idx_collector_perk_redemptions_type ON collector_perk_redemptions(perk_type);
CREATE INDEX IF NOT EXISTS idx_collector_perk_redemptions_status ON collector_perk_redemptions(redemption_status);
CREATE INDEX IF NOT EXISTS idx_collector_perk_redemptions_ledger_entry_id ON collector_perk_redemptions(ledger_entry_id);

-- ============================================
-- PART 5: Create collector_credit_subscriptions table
-- ============================================

CREATE TABLE IF NOT EXISTS collector_credit_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_identifier TEXT NOT NULL,
  subscription_status collector_subscription_status NOT NULL DEFAULT 'active',
  monthly_credit_amount NUMERIC(10,2) NOT NULL, -- credits to deposit each month
  subscription_tier TEXT, -- e.g., 'basic', 'premium', 'custom'
  billing_amount_usd NUMERIC(10,2) NOT NULL, -- monthly subscription cost in USD
  payment_method TEXT NOT NULL, -- 'stripe', 'paypal', etc.
  payment_subscription_id TEXT, -- external payment subscription ID
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_billing_date TIMESTAMP WITH TIME ZONE NOT NULL, -- when next credits will be deposited
  last_credited_at TIMESTAMP WITH TIME ZONE, -- last time credits were deposited
  paused_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for collector_credit_subscriptions
CREATE INDEX IF NOT EXISTS idx_collector_subscriptions_identifier ON collector_credit_subscriptions(collector_identifier);
CREATE INDEX IF NOT EXISTS idx_collector_subscriptions_status ON collector_credit_subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_collector_subscriptions_next_billing ON collector_credit_subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_collector_subscriptions_payment_id ON collector_credit_subscriptions(payment_subscription_id);

-- ============================================
-- PART 6: Add updated_at triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_collector_accounts_updated_at
  BEFORE UPDATE ON collector_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collector_perk_redemptions_updated_at
  BEFORE UPDATE ON collector_perk_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collector_credit_subscriptions_updated_at
  BEFORE UPDATE ON collector_credit_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 7: Helper function to calculate balance from ledger
-- ============================================

CREATE OR REPLACE FUNCTION get_collector_balance(p_collector_identifier TEXT)
RETURNS NUMERIC(10,2) AS $$
DECLARE
  v_balance NUMERIC(10,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_balance
  FROM collector_ledger_entries
  WHERE collector_identifier = p_collector_identifier;
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 8: Helper function to get total credits earned
-- ============================================

CREATE OR REPLACE FUNCTION get_collector_credits_earned(p_collector_identifier TEXT)
RETURNS NUMERIC(10,2) AS $$
DECLARE
  v_total NUMERIC(10,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM collector_ledger_entries
  WHERE collector_identifier = p_collector_identifier
    AND transaction_type IN ('credit_earned', 'subscription_credit')
    AND amount > 0;
  
  RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql;

