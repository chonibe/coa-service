-- Migration for Unified Ledger & Compliance System
-- Consolidates multiple ledger tables and enforces immutability

-- 1. Add new transaction types to collector_transaction_type enum
-- Using DO block for safe enum updates
DO $$
BEGIN
  -- Add refund_deduction if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'refund_deduction' AND enumtypid = 'collector_transaction_type'::regtype) THEN
    ALTER TYPE collector_transaction_type ADD VALUE 'refund_deduction';
  END IF;
  
  -- Add adjustment if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'adjustment' AND enumtypid = 'collector_transaction_type'::regtype) THEN
    ALTER TYPE collector_transaction_type ADD VALUE 'adjustment';
  END IF;

  -- Add platform_fee if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'platform_fee' AND enumtypid = 'collector_transaction_type'::regtype) THEN
    ALTER TYPE collector_transaction_type ADD VALUE 'platform_fee';
  END IF;
END $$;

-- 2. Add tax_year column to collector_ledger_entries
ALTER TABLE collector_ledger_entries 
ADD COLUMN IF NOT EXISTS tax_year INTEGER;

-- 3. Populate tax_year for existing entries
UPDATE collector_ledger_entries 
SET tax_year = EXTRACT(YEAR FROM created_at)
WHERE tax_year IS NULL;

-- 4. Create trigger to enforce immutability on collector_ledger_entries
CREATE OR REPLACE FUNCTION protect_ledger_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Deleting ledger entries is strictly forbidden for compliance.';
  ELSIF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Updating ledger entries is strictly forbidden. Corrections must be made via reversal entries.';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_ledger_immutability ON collector_ledger_entries;
CREATE TRIGGER trg_protect_ledger_immutability
BEFORE UPDATE OR DELETE ON collector_ledger_entries
FOR EACH ROW EXECUTE FUNCTION protect_ledger_immutability();

-- 5. Consolidate vendor_ledger_entries into collector_ledger_entries
-- We need to map vendor_name to auth_id for collector_identifier
DO $$
DECLARE
  v_entry RECORD;
  v_collector_id TEXT;
  v_transaction_type collector_transaction_type;
BEGIN
  -- Check if vendor_ledger_entries exists before trying to migrate
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_ledger_entries') THEN
    FOR v_entry IN SELECT * FROM vendor_ledger_entries LOOP
      -- Find vendor's auth_id
      SELECT auth_id::TEXT INTO v_collector_id 
      FROM vendors 
      WHERE vendor_name = v_entry.vendor_name 
      LIMIT 1;
      
      -- Fallback to vendor_name if auth_id is null
      v_collector_id := COALESCE(v_collector_id, v_entry.vendor_name);
      
      -- Map entry_type to transaction_type
      v_transaction_type := CASE 
        WHEN v_entry.entry_type = 'payout' THEN 
          CASE WHEN v_entry.amount > 0 THEN 'payout_earned'::collector_transaction_type ELSE 'payout_withdrawal'::collector_transaction_type END
        WHEN v_entry.entry_type = 'refund_deduction' THEN 'refund_deduction'::collector_transaction_type
        WHEN v_entry.entry_type = 'adjustment' THEN 'adjustment'::collector_transaction_type
        WHEN v_entry.entry_type = 'store_purchase' THEN 'payout_balance_purchase'::collector_transaction_type
        ELSE 'adjustment'::collector_transaction_type
      END;

      -- Insert into collector_ledger_entries (trigger only protects UPDATE/DELETE)
      INSERT INTO collector_ledger_entries (
        collector_identifier,
        transaction_type,
        amount,
        currency,
        order_id,
        line_item_id,
        payout_id,
        description,
        metadata,
        created_at,
        created_by,
        tax_year
      ) VALUES (
        v_collector_id,
        v_transaction_type,
        v_entry.amount,
        'USD',
        v_entry.order_id,
        v_entry.line_item_id,
        v_entry.payout_id,
        COALESCE(v_entry.description, 'Migrated from legacy ledger'),
        COALESCE(v_entry.metadata, '{}'::jsonb),
        v_entry.created_at,
        v_entry.created_by,
        EXTRACT(YEAR FROM v_entry.created_at)
      );
    END LOOP;
  END IF;
END $$;

-- 6. Add tax_year index for reporting
CREATE INDEX IF NOT EXISTS idx_collector_ledger_tax_year ON collector_ledger_entries(tax_year);

