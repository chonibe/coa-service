-- ============================================
-- Diagnostic Query: Check Ledger Backfill Status
-- ============================================
-- Run this to diagnose why the ledger might be showing 0
-- ============================================

-- Check 1: How many fulfilled line items exist?
SELECT 
  'Fulfilled Line Items' as check_name,
  COUNT(*) as count,
  COUNT(DISTINCT vendor_name) as unique_vendors,
  SUM(
    CASE 
      WHEN pvp.is_percentage THEN (COALESCE(oli.price, 0) * COALESCE(pvp.payout_amount, 25) / 100)
      ELSE COALESCE(pvp.payout_amount, 0)
    END
  ) as estimated_total_payout
FROM order_line_items_v2 oli
LEFT JOIN product_vendor_payouts pvp 
  ON oli.product_id::TEXT = pvp.product_id::TEXT 
  AND oli.vendor_name = pvp.vendor_name
WHERE 
  oli.vendor_name IS NOT NULL
  AND oli.fulfillment_status = 'fulfilled';

-- Check 2: How many ledger entries exist for payouts?
SELECT 
  'Ledger Payout Entries' as check_name,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  COUNT(DISTINCT collector_identifier) as unique_collectors
FROM collector_ledger_entries
WHERE 
  transaction_type = 'payout_earned'
  AND currency = 'USD';

-- Check 3: Which line items are missing from the ledger?
SELECT 
  oli.line_item_id,
  oli.vendor_name,
  oli.order_id,
  oli.price,
  COALESCE(pvp.payout_amount, 25) as payout_amount,
  COALESCE(pvp.is_percentage, true) as is_percentage,
  CASE 
    WHEN pvp.is_percentage THEN (COALESCE(oli.price, 0) * COALESCE(pvp.payout_amount, 25) / 100)
    ELSE COALESCE(pvp.payout_amount, 0)
  END as calculated_payout,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM collector_ledger_entries cle
      WHERE cle.line_item_id = oli.line_item_id::TEXT
        AND cle.transaction_type = 'payout_earned'
        AND cle.currency = 'USD'
    ) THEN 'IN LEDGER'
    ELSE 'MISSING FROM LEDGER'
  END as ledger_status
FROM order_line_items_v2 oli
LEFT JOIN product_vendor_payouts pvp 
  ON oli.product_id::TEXT = pvp.product_id::TEXT 
  AND oli.vendor_name = pvp.vendor_name
WHERE 
  oli.vendor_name IS NOT NULL
  AND oli.fulfillment_status = 'fulfilled'
ORDER BY oli.vendor_name, oli.order_id
LIMIT 20;

-- Check 4: Do vendors have collector accounts?
SELECT 
  v.vendor_name,
  v.auth_id,
  COALESCE(v.auth_id, v.vendor_name) as collector_identifier,
  CASE 
    WHEN ca.id IS NOT NULL THEN 'HAS ACCOUNT'
    ELSE 'NO ACCOUNT'
  END as account_status
FROM vendors v
LEFT JOIN collector_accounts ca 
  ON ca.collector_identifier = COALESCE(v.auth_id, v.vendor_name)
WHERE v.vendor_name IN (
  SELECT DISTINCT vendor_name 
  FROM order_line_items_v2 
  WHERE fulfillment_status = 'fulfilled' 
    AND vendor_name IS NOT NULL
)
ORDER BY v.vendor_name;

-- Check 5: What's the current USD balance for each vendor?
SELECT 
  v.vendor_name,
  COALESCE(v.auth_id, v.vendor_name) as collector_identifier,
  COALESCE(
    (SELECT SUM(amount) 
     FROM collector_ledger_entries 
     WHERE collector_identifier = COALESCE(v.auth_id, v.vendor_name)
       AND currency = 'USD'
    ), 
    0
  ) as current_usd_balance,
  COALESCE(
    (SELECT SUM(amount) 
     FROM collector_ledger_entries 
     WHERE collector_identifier = COALESCE(v.auth_id, v.vendor_name)
       AND currency = 'USD'
       AND transaction_type = 'payout_earned'
    ), 
    0
  ) as total_earned,
  COALESCE(
    (SELECT ABS(SUM(amount)) 
     FROM collector_ledger_entries 
     WHERE collector_identifier = COALESCE(v.auth_id, v.vendor_name)
       AND currency = 'USD'
       AND transaction_type = 'payout_withdrawal'
    ), 
    0
  ) as total_withdrawn
FROM vendors v
WHERE v.vendor_name IN (
  SELECT DISTINCT vendor_name 
  FROM order_line_items_v2 
  WHERE fulfillment_status = 'fulfilled' 
    AND vendor_name IS NOT NULL
)
ORDER BY v.vendor_name;

