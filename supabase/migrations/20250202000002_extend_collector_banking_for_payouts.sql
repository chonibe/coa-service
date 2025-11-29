-- Migration to extend collector banking system for USD payout support
-- Adds currency field and new transaction types for payout earnings, withdrawals, and balance purchases

-- ============================================
-- PART 1: Add new transaction types to enum
-- ============================================

-- Add new transaction types for payout operations
DO $$
DECLARE
  v_enum_exists BOOLEAN;
  v_enum_oid OID;
BEGIN
  -- Check if the enum type exists
  SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'collector_transaction_type'
  ) INTO v_enum_exists;

  IF NOT v_enum_exists THEN
    -- Create the enum with all values if it doesn't exist
    CREATE TYPE collector_transaction_type AS ENUM (
      'credit_earned', 
      'subscription_credit', 
      'purchase', 
      'perk_redemption',
      'payout_earned',
      'payout_withdrawal',
      'payout_balance_purchase'
    );
  ELSE
    -- Enum exists, add new values if they don't already exist
    SELECT oid INTO v_enum_oid FROM pg_type WHERE typname = 'collector_transaction_type';

    -- Add payout_earned (USD deposited when line items are fulfilled)
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'payout_earned' 
      AND enumtypid = v_enum_oid
    ) THEN
      ALTER TYPE collector_transaction_type ADD VALUE 'payout_earned';
    END IF;

    -- Add payout_withdrawal (USD withdrawn when payout is processed)
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'payout_withdrawal' 
      AND enumtypid = v_enum_oid
    ) THEN
      ALTER TYPE collector_transaction_type ADD VALUE 'payout_withdrawal';
    END IF;

    -- Add payout_balance_purchase (USD spent from payout balance for store purchases)
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'payout_balance_purchase' 
      AND enumtypid = v_enum_oid
    ) THEN
      ALTER TYPE collector_transaction_type ADD VALUE 'payout_balance_purchase';
    END IF;
  END IF;
END $$;

-- ============================================
-- PART 2: Add currency field to collector_ledger_entries
-- ============================================

-- Add currency column (defaults to 'CREDITS' for backward compatibility)
-- Only if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'collector_ledger_entries'
  ) THEN
    -- Add currency column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'collector_ledger_entries' 
      AND column_name = 'currency'
    ) THEN
      ALTER TABLE collector_ledger_entries
      ADD COLUMN currency TEXT NOT NULL DEFAULT 'CREDITS';
    END IF;
    
    -- Add check constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      AND table_name = 'collector_ledger_entries' 
      AND constraint_name = 'collector_ledger_entries_currency_check'
    ) THEN
      ALTER TABLE collector_ledger_entries
      ADD CONSTRAINT collector_ledger_entries_currency_check 
      CHECK (currency IN ('CREDITS', 'USD'));
    END IF;

    -- Create index on currency for faster queries
    CREATE INDEX IF NOT EXISTS idx_collector_ledger_currency ON collector_ledger_entries(currency);
  END IF;
END $$;

-- ============================================
-- PART 3: Add payout_id reference for tracking payout withdrawals
-- ============================================

-- Add payout_id column to link withdrawals to vendor_payouts
-- Only if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'collector_ledger_entries'
  ) THEN
    -- Add payout_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'collector_ledger_entries' 
      AND column_name = 'payout_id'
    ) THEN
      -- Check if vendor_payouts table exists before adding foreign key
      IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'vendor_payouts'
      ) THEN
        ALTER TABLE collector_ledger_entries
        ADD COLUMN payout_id INTEGER REFERENCES vendor_payouts(id) ON DELETE SET NULL;
      ELSE
        -- Add column without foreign key if vendor_payouts doesn't exist
        ALTER TABLE collector_ledger_entries
        ADD COLUMN payout_id INTEGER;
      END IF;
    END IF;

    -- Create index on payout_id
    CREATE INDEX IF NOT EXISTS idx_collector_ledger_payout_id ON collector_ledger_entries(payout_id);
  END IF;
END $$;

-- ============================================
-- PART 4: Update helper functions to support currency
-- ============================================

-- Update get_collector_balance to support currency filtering
-- Only create/update if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'collector_ledger_entries'
  ) THEN
    -- Update get_collector_balance to support currency filtering
    EXECUTE '
    CREATE OR REPLACE FUNCTION get_collector_balance(p_collector_identifier TEXT, p_currency TEXT DEFAULT ''CREDITS'')
    RETURNS NUMERIC(10,2) AS $function$
    DECLARE
      v_balance NUMERIC(10,2);
    BEGIN
      SELECT COALESCE(SUM(amount), 0) INTO v_balance
      FROM collector_ledger_entries
      WHERE collector_identifier = p_collector_identifier
        AND currency = p_currency;
      
      RETURN COALESCE(v_balance, 0);
    END;
    $function$ LANGUAGE plpgsql;';

    -- Create function to get USD balance
    EXECUTE '
    CREATE OR REPLACE FUNCTION get_collector_usd_balance(p_collector_identifier TEXT)
    RETURNS NUMERIC(10,2) AS $function$
    BEGIN
      RETURN get_collector_balance(p_collector_identifier, ''USD'');
    END;
    $function$ LANGUAGE plpgsql;';

    -- Create function to get credits balance
    EXECUTE '
    CREATE OR REPLACE FUNCTION get_collector_credits_balance(p_collector_identifier TEXT)
    RETURNS NUMERIC(10,2) AS $function$
    BEGIN
      RETURN get_collector_balance(p_collector_identifier, ''CREDITS'');
    END;
    $function$ LANGUAGE plpgsql;';
  END IF;
END $$;

-- ============================================
-- PART 5: Create function to get unified balance (both credits and USD)
-- ============================================

-- Only create if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'collector_ledger_entries'
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION get_collector_unified_balance(p_collector_identifier TEXT)
    RETURNS TABLE (
      credits_balance NUMERIC(10,2),
      usd_balance NUMERIC(10,2),
      total_credits_earned NUMERIC(10,2),
      total_usd_earned NUMERIC(10,2)
    ) AS $function$
    BEGIN
      RETURN QUERY
      SELECT 
        COALESCE(SUM(CASE WHEN currency = ''CREDITS'' THEN amount ELSE 0 END), 0)::NUMERIC(10,2) as credits_balance,
        COALESCE(SUM(CASE WHEN currency = ''USD'' THEN amount ELSE 0 END), 0)::NUMERIC(10,2) as usd_balance,
        COALESCE(SUM(CASE WHEN currency = ''CREDITS'' AND amount > 0 AND transaction_type IN (''credit_earned'', ''subscription_credit'') THEN amount ELSE 0 END), 0)::NUMERIC(10,2) as total_credits_earned,
        COALESCE(SUM(CASE WHEN currency = ''USD'' AND amount > 0 AND transaction_type = ''payout_earned'' THEN amount ELSE 0 END), 0)::NUMERIC(10,2) as total_usd_earned
      FROM collector_ledger_entries
      WHERE collector_identifier = p_collector_identifier;
    END;
    $function$ LANGUAGE plpgsql;';
  END IF;
END $$;

