-- ============================================
-- Backfill Collector Ledger from Historical Payouts
-- ============================================
-- This migration backfills the collector_ledger_entries table with historical
-- payout data from fulfilled line items that existed before the banking system.
--
-- It:
-- 1. Creates payout_earned entries for all fulfilled line items that haven't been deposited yet
-- 2. Creates payout_withdrawal entries for payouts that were already processed
-- 3. Ensures collector accounts exist for all vendors
-- ============================================

DO $$
DECLARE
  v_line_item RECORD;
  v_vendor RECORD;
  v_payout RECORD;
  v_payout_item RECORD;
  v_collector_identifier TEXT;
  v_payout_amount DECIMAL;
  v_ledger_entry_id INTEGER;
  v_count INTEGER := 0;
  v_withdrawal_count INTEGER := 0;
  v_price_usd DECIMAL;
  v_gbp_to_usd_rate DECIMAL := 1.27; -- Match convertGBPToUSD rate from lib/utils.ts
BEGIN
  RAISE NOTICE 'Starting backfill of collector ledger from historical payouts...';

  -- ============================================
  -- PART 1: Backfill payout_earned entries for fulfilled line items
  -- ============================================
  
  RAISE NOTICE 'Part 1: Processing fulfilled line items...';

  FOR v_line_item IN
    SELECT DISTINCT
      oli.line_item_id,
      oli.order_id,
      oli.vendor_name,
      oli.product_id,
      oli.price,
      oli.fulfillment_status,
      o.currency_code,
      o.raw_shopify_order_data,
      COALESCE(pvp.payout_amount, 25) as payout_amount,
      COALESCE(pvp.is_percentage, true) as is_percentage
    FROM order_line_items_v2 oli
    LEFT JOIN orders o ON oli.order_id = o.id
    LEFT JOIN product_vendor_payouts pvp 
      ON oli.product_id::TEXT = pvp.product_id::TEXT 
      AND oli.vendor_name = pvp.vendor_name
    WHERE 
      oli.vendor_name IS NOT NULL
      AND oli.fulfillment_status = 'fulfilled'
      -- Exclude line items that already have ledger entries
      -- Handle both TEXT and numeric line_item_id formats
      AND NOT EXISTS (
        SELECT 1 
        FROM collector_ledger_entries cle
        WHERE (
          cle.line_item_id = oli.line_item_id::TEXT
          OR cle.line_item_id = oli.line_item_id::BIGINT::TEXT
          OR cle.line_item_id::BIGINT = oli.line_item_id::BIGINT
        )
        AND cle.transaction_type = 'payout_earned'
        AND cle.currency = 'USD'
      )
  LOOP
    BEGIN
      -- Get vendor info
      SELECT id, auth_id, vendor_name
      INTO v_vendor
      FROM vendors
      WHERE vendor_name = v_line_item.vendor_name
      LIMIT 1;

      IF v_vendor IS NULL THEN
        RAISE NOTICE 'Skipping line item % - vendor % not found', v_line_item.line_item_id, v_line_item.vendor_name;
        CONTINUE;
      END IF;

      -- Get collector identifier (cast auth_id to TEXT if it exists)
      v_collector_identifier := COALESCE(v_vendor.auth_id::TEXT, v_vendor.vendor_name);

      -- Ensure collector account exists
      INSERT INTO collector_accounts (collector_identifier, account_type, vendor_id, account_status)
      VALUES (v_collector_identifier, 'vendor', v_vendor.id, 'active')
      ON CONFLICT (collector_identifier) DO NOTHING;

      -- Calculate payout amount
      -- Use original price (before discount) for payout calculation
      -- Convert to USD only if order currency is GBP
      DECLARE
        v_order_currency TEXT;
        v_original_price DECIMAL;
        v_price_for_calc DECIMAL;
        v_shopify_line_item JSONB;
        v_discount_total DECIMAL := 0;
      BEGIN
        -- Get order currency (already in v_line_item.currency_code from JOIN)
        v_order_currency := COALESCE(v_line_item.currency_code, 'USD');
        
        -- Try to get original price from Shopify order data (before discount)
        v_original_price := COALESCE(v_line_item.price, 0)::DECIMAL;
        
        -- Extract original price from raw Shopify order data if available
        IF v_line_item.raw_shopify_order_data IS NOT NULL THEN
          -- Find the line item in the Shopify order data
          v_shopify_line_item := (
            SELECT jsonb_array_elements(v_line_item.raw_shopify_order_data->'line_items')
            WHERE (jsonb_array_elements(v_line_item.raw_shopify_order_data->'line_items')->>'id')::TEXT = v_line_item.line_item_id::TEXT
            LIMIT 1
          );
          
          IF v_shopify_line_item IS NOT NULL THEN
            -- Use original_price if available, otherwise calculate from price + discounts
            IF v_shopify_line_item->>'original_price' IS NOT NULL THEN
              v_original_price := (v_shopify_line_item->>'original_price')::DECIMAL;
            ELSIF v_shopify_line_item->'discount_allocations' IS NOT NULL THEN
              -- Calculate original price by adding back discounts
              SELECT COALESCE(SUM((disc->>'amount')::DECIMAL), 0)
              INTO v_discount_total
              FROM jsonb_array_elements(v_shopify_line_item->'discount_allocations') AS disc;
              
              v_original_price := COALESCE((v_shopify_line_item->>'price')::DECIMAL, v_line_item.price) + v_discount_total;
            END IF;
          END IF;
        END IF;
        
        -- Convert to USD only if currency is GBP
        IF UPPER(v_order_currency) = 'GBP' THEN
          v_price_for_calc := v_original_price * v_gbp_to_usd_rate;
        ELSE
          v_price_for_calc := v_original_price;
        END IF;
        
        -- Calculate payout based on original price (before discount)
        IF v_line_item.is_percentage THEN
          v_payout_amount := (v_price_for_calc * v_line_item.payout_amount::DECIMAL / 100);
        ELSE
          -- For fixed amounts, convert to USD if order was GBP
          IF UPPER(v_order_currency) = 'GBP' THEN
            v_payout_amount := v_line_item.payout_amount::DECIMAL * v_gbp_to_usd_rate;
          ELSE
            v_payout_amount := v_line_item.payout_amount::DECIMAL;
          END IF;
        END IF;
      END;

      IF v_payout_amount <= 0 THEN
        RAISE NOTICE 'Skipping line item % - payout amount is zero or negative', v_line_item.line_item_id;
        CONTINUE;
      END IF;

      -- Create ledger entry for payout earned
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
        'Historical payout earnings from fulfilled order ' || v_line_item.order_id::TEXT,
        jsonb_build_object(
          'vendor_name', v_line_item.vendor_name,
          'product_id', v_line_item.product_id,
          'line_item_price', v_line_item.price,
          'payout_setting', jsonb_build_object(
            'payout_amount', v_line_item.payout_amount,
            'is_percentage', v_line_item.is_percentage
          ),
          'backfilled', true,
          'backfill_date', NOW()
        ),
        'system'
      )
      RETURNING id INTO v_ledger_entry_id;

      v_count := v_count + 1;

      IF v_count % 100 = 0 THEN
        RAISE NOTICE 'Processed % line items...', v_count;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error processing line item %: %', v_line_item.line_item_id, SQLERRM;
      CONTINUE;
    END;
  END LOOP;

  RAISE NOTICE 'Part 1 complete: Created % payout_earned entries', v_count;

  -- ============================================
  -- PART 2: Backfill payout_withdrawal entries for processed payouts
  -- ============================================
  
  RAISE NOTICE 'Part 2: Processing processed payouts...';

  FOR v_payout IN
    SELECT 
      vp.id,
      vp.vendor_name,
      vp.amount,
      vp.status,
      vp.payout_date,
      vp.created_at
    FROM vendor_payouts vp
    WHERE vp.status IN ('paid', 'completed', 'processed')
      -- Exclude payouts that already have withdrawal entries
      AND NOT EXISTS (
        SELECT 1 
        FROM collector_ledger_entries cle
        WHERE cle.payout_id = vp.id
          AND cle.transaction_type = 'payout_withdrawal'
          AND cle.currency = 'USD'
      )
  LOOP
    BEGIN
      -- Get vendor info
      SELECT id, auth_id, vendor_name
      INTO v_vendor
      FROM vendors
      WHERE vendor_name = v_payout.vendor_name
      LIMIT 1;

      IF v_vendor IS NULL THEN
        RAISE NOTICE 'Skipping payout % - vendor % not found', v_payout.id, v_payout.vendor_name;
        CONTINUE;
      END IF;

      -- Get collector identifier (cast auth_id to TEXT if it exists)
      v_collector_identifier := COALESCE(v_vendor.auth_id::TEXT, v_vendor.vendor_name);

      -- Ensure collector account exists
      INSERT INTO collector_accounts (collector_identifier, account_type, vendor_id, account_status)
      VALUES (v_collector_identifier, 'vendor', v_vendor.id, 'active')
      ON CONFLICT (collector_identifier) DO NOTHING;

      -- Create ledger entry for payout withdrawal (negative amount)
      INSERT INTO collector_ledger_entries (
        collector_identifier,
        transaction_type,
        amount,
        currency,
        payout_id,
        description,
        metadata,
        created_by
      )
      VALUES (
        v_collector_identifier,
        'payout_withdrawal',
        -ABS(v_payout.amount::DECIMAL), -- Negative amount for withdrawal
        'USD',
        v_payout.id,
        'Historical payout withdrawal for payout ID ' || v_payout.id::TEXT,
        jsonb_build_object(
          'vendor_name', v_payout.vendor_name,
          'payout_status', v_payout.status,
          'payout_date', v_payout.payout_date,
          'backfilled', true,
          'backfill_date', NOW()
        ),
        'system'
      )
      RETURNING id INTO v_ledger_entry_id;

      v_withdrawal_count := v_withdrawal_count + 1;

      IF v_withdrawal_count % 50 = 0 THEN
        RAISE NOTICE 'Processed % withdrawals...', v_withdrawal_count;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error processing payout %: %', v_payout.id, SQLERRM;
      CONTINUE;
    END;
  END LOOP;

  RAISE NOTICE 'Part 2 complete: Created % payout_withdrawal entries', v_withdrawal_count;

  -- ============================================
  -- PART 3: Summary
  -- ============================================
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Backfill Summary:';
  RAISE NOTICE '  - Payout earned entries: %', v_count;
  RAISE NOTICE '  - Payout withdrawal entries: %', v_withdrawal_count;
  RAISE NOTICE '  - Total entries created: %', v_count + v_withdrawal_count;
  RAISE NOTICE '========================================';

END $$;

