-- ============================================
-- Simple Backfill: Create Ledger Entries for Fulfilled Line Items
-- ============================================
-- This is a simpler version that will show exactly what's happening
-- Run this AFTER the main backfill if it didn't work
-- ============================================

DO $$
DECLARE
  v_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_line_item RECORD;
  v_vendor RECORD;
  v_collector_identifier TEXT;
  v_payout_amount DECIMAL;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Starting simple backfill...';
  RAISE NOTICE '========================================';

  -- Process each fulfilled line item
  FOR v_line_item IN
    SELECT 
      oli.line_item_id,
      oli.order_id,
      oli.vendor_name,
      oli.product_id,
      oli.price,
      COALESCE(pvp.payout_amount, 25) as payout_amount,
      COALESCE(pvp.is_percentage, true) as is_percentage
    FROM order_line_items_v2 oli
    LEFT JOIN product_vendor_payouts pvp 
      ON oli.product_id::TEXT = pvp.product_id::TEXT 
      AND oli.vendor_name = pvp.vendor_name
    WHERE 
      oli.vendor_name IS NOT NULL
      AND oli.fulfillment_status = 'fulfilled'
      -- Only process items NOT already in ledger
      AND NOT EXISTS (
        SELECT 1 
        FROM collector_ledger_entries cle
        WHERE cle.line_item_id = oli.line_item_id::TEXT
          AND cle.transaction_type = 'payout_earned'
          AND cle.currency = 'USD'
      )
    LIMIT 100  -- Process first 100 to test
  LOOP
    BEGIN
      -- Get vendor
      SELECT id, auth_id, vendor_name
      INTO v_vendor
      FROM vendors
      WHERE vendor_name = v_line_item.vendor_name
      LIMIT 1;

      IF v_vendor IS NULL THEN
        RAISE WARNING 'Vendor not found: %', v_line_item.vendor_name;
        v_error_count := v_error_count + 1;
        CONTINUE;
      END IF;

      -- Get collector identifier
      v_collector_identifier := COALESCE(v_vendor.auth_id::TEXT, v_vendor.vendor_name);
      
      -- Ensure account exists
      INSERT INTO collector_accounts (collector_identifier, account_type, vendor_id, account_status)
      VALUES (v_collector_identifier, 'vendor', v_vendor.id, 'active')
      ON CONFLICT (collector_identifier) DO NOTHING;

      -- Calculate payout
      IF v_line_item.is_percentage THEN
        v_payout_amount := (COALESCE(v_line_item.price, 0)::DECIMAL * v_line_item.payout_amount::DECIMAL / 100);
      ELSE
        v_payout_amount := v_line_item.payout_amount::DECIMAL;
      END IF;

      IF v_payout_amount <= 0 THEN
        RAISE WARNING 'Invalid payout amount for line item %: %', v_line_item.line_item_id, v_payout_amount;
        v_error_count := v_error_count + 1;
        CONTINUE;
      END IF;

      -- Insert ledger entry
      INSERT INTO collector_ledger_entries (
        collector_identifier,
        transaction_type,
        amount,
        currency,
        order_id,
        line_item_id,
        description,
        metadata,
        created_by
      )
      VALUES (
        v_collector_identifier,
        'payout_earned',
        v_payout_amount,
        'USD',
        v_line_item.order_id::TEXT,
        v_line_item.line_item_id::TEXT,
        'Historical payout: ' || v_line_item.vendor_name || ' - Order ' || v_line_item.order_id::TEXT,
        jsonb_build_object(
          'vendor_name', v_line_item.vendor_name,
          'backfilled', true
        ),
        'system'
      );

      v_count := v_count + 1;
      
      IF v_count % 10 = 0 THEN
        RAISE NOTICE 'Created % entries so far...', v_count;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'ERROR inserting line item %: % (SQLSTATE: %)', 
        v_line_item.line_item_id, SQLERRM, SQLSTATE;
      v_error_count := v_error_count + 1;
    END;
  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Simple Backfill Complete:';
  RAISE NOTICE '  - Entries created: %', v_count;
  RAISE NOTICE '  - Errors: %', v_error_count;
  RAISE NOTICE '========================================';

END $$;

-- Verify what was created
SELECT 
  'Verification' as check_name,
  COUNT(*) as entries_created,
  COUNT(DISTINCT collector_identifier) as unique_vendors,
  SUM(amount) as total_amount
FROM collector_ledger_entries
WHERE 
  transaction_type = 'payout_earned'
  AND currency = 'USD'
  AND created_at > NOW() - INTERVAL '5 minutes';

