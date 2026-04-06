-- Automated Payout Sync Trigger
-- Ensures any payout marked as 'completed' is automatically recorded in the ledger

-- 1. Create the sync function
CREATE OR REPLACE FUNCTION sync_completed_payout_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
  v_collector_id TEXT;
BEGIN
  -- Only proceed if status is changing to 'completed'
  IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed')) THEN
    
    -- Find vendor's auth_id
    SELECT auth_id::TEXT INTO v_collector_id 
    FROM vendors 
    WHERE vendor_name = NEW.vendor_name 
    LIMIT 1;
    
    -- Fallback to vendor_name
    v_collector_id := COALESCE(v_collector_id, NEW.vendor_name);
    
    -- Insert withdrawal into ledger if it doesn't already exist
    IF NOT EXISTS (
      SELECT 1 FROM collector_ledger_entries 
      WHERE payout_id = NEW.id AND transaction_type = 'payout_withdrawal'
    ) THEN
      INSERT INTO collector_ledger_entries (
        collector_identifier,
        transaction_type,
        amount,
        currency,
        payout_id,
        description,
        metadata,
        created_at,
        created_by,
        tax_year
      ) VALUES (
        v_collector_id,
        'payout_withdrawal',
        -ABS(NEW.amount),
        'USD',
        NEW.id,
        COALESCE(NEW.notes, 'Automated withdrawal for completed payout'),
        jsonb_build_object(
          'automated', true,
          'payout_reference', NEW.reference
        ),
        COALESCE(NEW.payout_date, NOW()),
        'system_trigger',
        EXTRACT(YEAR FROM COALESCE(NEW.payout_date, NOW()))
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 2. Create the trigger
DROP TRIGGER IF EXISTS trg_sync_completed_payout ON vendor_payouts;
CREATE TRIGGER trg_sync_completed_payout
AFTER UPDATE ON vendor_payouts
FOR EACH ROW
EXECUTE FUNCTION sync_completed_payout_to_ledger();
