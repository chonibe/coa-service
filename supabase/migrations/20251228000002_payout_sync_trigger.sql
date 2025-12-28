-- Automated Guardrail: Synchronize completed payouts to the unified ledger
-- This trigger ensures that whenever a payout is marked as 'completed', 
-- a corresponding withdrawal entry is automatically recorded in the ledger.

-- 1. Create the sync function
CREATE OR REPLACE FUNCTION sync_payout_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
    v_collector_id TEXT;
    v_tax_year INTEGER;
BEGIN
    -- Only act when status changes to 'completed'
    IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')) THEN
        
        -- Resolve collector_identifier
        SELECT auth_id::TEXT INTO v_collector_id
        FROM vendors
        WHERE vendor_name = NEW.vendor_name
        LIMIT 1;

        v_collector_id := COALESCE(v_collector_id, NEW.vendor_name);
        v_tax_year := EXTRACT(YEAR FROM COALESCE(NEW.payout_date, NOW()));

        -- Ensure a ledger entry doesn't already exist for this payout_id (idempotency)
        IF NOT EXISTS (SELECT 1 FROM collector_ledger_entries WHERE payout_id = NEW.id) THEN
            INSERT INTO collector_ledger_entries (
                collector_identifier,
                transaction_type,
                amount,
                currency,
                payout_id,
                description,
                metadata,
                tax_year,
                created_at,
                created_by
            ) VALUES (
                v_collector_id,
                'payout_withdrawal',
                -ABS(NEW.amount),
                'USD',
                NEW.id,
                COALESCE(NEW.notes, 'Payout withdrawal: ' || COALESCE(NEW.reference, 'ID-' || NEW.id)),
                jsonb_build_object(
                    'automated_sync', true,
                    'reference', NEW.reference,
                    'payment_method', NEW.payment_method
                ),
                v_tax_year,
                COALESCE(NEW.payout_date, NOW()),
                COALESCE(NEW.processed_by, 'system')
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach the trigger
DROP TRIGGER IF EXISTS trg_sync_payout_to_ledger ON vendor_payouts;
CREATE TRIGGER trg_sync_payout_to_ledger
AFTER UPDATE ON vendor_payouts
FOR EACH ROW
EXECUTE FUNCTION sync_payout_to_ledger();

-- 3. Also handle initial insertions if status is already completed
DROP TRIGGER IF EXISTS trg_sync_payout_insert_to_ledger ON vendor_payouts;
CREATE TRIGGER trg_sync_payout_insert_to_ledger
AFTER INSERT ON vendor_payouts
FOR EACH ROW
EXECUTE FUNCTION sync_payout_to_ledger();
