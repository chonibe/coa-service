-- ============================================
-- Quick Check: Do we have fulfilled line items?
-- ============================================
-- Run this to see if there are any fulfilled line items to backfill
-- ============================================

-- Check 1: Count of fulfilled line items
SELECT 
  'Fulfilled Line Items Count' as check_name,
  COUNT(*) as total_fulfilled_items,
  COUNT(DISTINCT oli.vendor_name) as vendors_with_fulfilled_items
FROM order_line_items_v2 oli
WHERE 
  oli.vendor_name IS NOT NULL
  AND oli.fulfillment_status = 'fulfilled';

-- Check 2: Sample of fulfilled line items (first 10)
SELECT 
  oli.line_item_id,
  oli.vendor_name,
  oli.order_id,
  oli.price,
  oli.fulfillment_status,
  oli.created_at
FROM order_line_items_v2 oli
WHERE 
  oli.vendor_name IS NOT NULL
  AND oli.fulfillment_status = 'fulfilled'
ORDER BY oli.created_at DESC
LIMIT 10;

-- Check 3: How many already have ledger entries?
SELECT 
  'Line Items with Ledger Entries' as check_name,
  COUNT(DISTINCT cle.line_item_id) as items_in_ledger
FROM collector_ledger_entries cle
WHERE 
  cle.transaction_type = 'payout_earned'
  AND cle.currency = 'USD'
  AND cle.line_item_id IS NOT NULL;

-- Check 4: Estimated total payout from fulfilled items
SELECT 
  oli.vendor_name,
  COUNT(*) as fulfilled_items_count,
  SUM(
    CASE 
      WHEN pvp.is_percentage THEN (COALESCE(oli.price, 0) * COALESCE(pvp.payout_amount, 25) / 100)
      ELSE COALESCE(pvp.payout_amount, 0)
    END
  ) as estimated_payout
FROM order_line_items_v2 oli
LEFT JOIN product_vendor_payouts pvp 
  ON oli.product_id::TEXT = pvp.product_id::TEXT 
  AND oli.vendor_name = pvp.vendor_name
WHERE 
  oli.vendor_name IS NOT NULL
  AND oli.fulfillment_status = 'fulfilled'
  -- Exclude items that already have ledger entries
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
GROUP BY oli.vendor_name
ORDER BY estimated_payout DESC
LIMIT 20;

