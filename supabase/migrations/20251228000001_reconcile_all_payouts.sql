-- Global reconciliation: Identify and fix historical payout discrepancies
-- This script finds completed payouts that are missing from the ledger and creates the missing entries.

DO $$
DECLARE
    v_payout RECORD;
    v_collector_id TEXT;
BEGIN
    -- 1. Loop through all completed payouts that don't have a matching ledger entry
    FOR v_payout IN 
        SELECT vp.* 
        FROM vendor_payouts vp
        LEFT JOIN collector_ledger_entries cle ON vp.id = cle.payout_id
        WHERE vp.status = 'completed' AND cle.id IS NULL
    LOOP
        -- 2. Resolve the collector_identifier (prefer auth_id, fallback to vendor_name)
        SELECT auth_id::TEXT INTO v_collector_id
        FROM vendors
        WHERE vendor_name = v_payout.vendor_name
        LIMIT 1;

        v_collector_id := COALESCE(v_collector_id, v_payout.vendor_name);

        -- 3. Insert the missing withdrawal entry
        -- Note: We use the original payout_date for the created_at timestamp
        -- Note: amount is stored as positive in vendor_payouts, but must be negative in the ledger for withdrawal
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
            -ABS(v_payout.amount),
            'USD',
            v_payout.id,
            COALESCE(v_payout.notes, 'Reconciled legacy payout withdrawal'),
            jsonb_build_object(
                'reconciled', true,
                'reconciliation_date', NOW(),
                'original_reference', v_payout.reference,
                'payment_method', v_payout.payment_method
            ),
            EXTRACT(YEAR FROM v_payout.payout_date),
            v_payout.payout_date,
            COALESCE(v_payout.processed_by, 'system')
        );

        RAISE NOTICE 'Reconciled payout #% for vendor % (amount: %)', v_payout.id, v_payout.vendor_name, v_payout.amount;
    END LOOP;
END $$;
