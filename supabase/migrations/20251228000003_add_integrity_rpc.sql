-- Database function to check ledger payout integrity across the entire platform
-- Returns the count of completed payouts that are missing from the ledger.

CREATE OR REPLACE FUNCTION check_ledger_payout_integrity()
RETURNS INTEGER AS $$
DECLARE
    v_missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_missing_count
    FROM vendor_payouts vp
    LEFT JOIN collector_ledger_entries cle ON vp.id = cle.payout_id
    WHERE vp.status = 'completed' AND cle.id IS NULL;
    
    RETURN v_missing_count;
END;
$$ LANGUAGE plpgsql;





