-- Global Reconciliation Migration
-- Retroactively adds missing payout_withdrawal entries for completed payouts

DO $$
DECLARE
  v_payout RECORD;
  v_collector_id TEXT;
BEGIN
  -- Find all completed payouts that are NOT in the ledger
  FOR v_payout IN 
    SELECT vp.* 
    FROM vendor_payouts vp
    LEFT JOIN collector_ledger_entries cle ON vp.id = cle.payout_id 
      AND cle.transaction_type = 'payout_withdrawal'
    WHERE vp.status = 'completed' 
      AND cle.id IS NULL
  LOOP
    -- Find vendor's auth_id
    SELECT auth_id::TEXT INTO v_collector_id 
    FROM vendors 
    WHERE vendor_name = v_payout.vendor_name 
    LIMIT 1;
    
    -- Fallback to vendor_name if auth_id is null
    v_collector_id := COALESCE(v_collector_id, v_payout.vendor_name);
    
    -- Insert the missing withdrawal entry
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
      -ABS(v_payout.amount), -- Ensure it is negative
      'USD',
      v_payout.id,
      COALESCE(v_payout.notes, 'Reconciled withdrawal for completed payout'),
      jsonb_build_object(
        'reconciled', true,
        'original_reference', v_payout.reference,
        'original_date', v_payout.payout_date
      ),
      COALESCE(v_payout.payout_date, v_payout.created_at),
      'system_reconciliation',
      EXTRACT(YEAR FROM COALESCE(v_payout.payout_date, v_payout.created_at))
    );
    
    RAISE NOTICE 'Reconciled payout #% for vendor %', v_payout.id, v_payout.vendor_name;
  END LOOP;
END $$;
