-- ============================================
-- Deep Dive: Check Why Ledger Entries Are Missing
-- ============================================

-- Check 1: Do ANY ledger entries exist at all?
SELECT 
  'All Ledger Entries' as check_name,
  COUNT(*) as total_entries,
  COUNT(DISTINCT collector_identifier) as unique_identifiers,
  MIN(created_at) as oldest_entry,
  MAX(created_at) as newest_entry
FROM collector_ledger_entries;

-- Check 2: What collector identifiers exist in the ledger?
SELECT 
  collector_identifier,
  COUNT(*) as entry_count,
  SUM(amount) as total_amount,
  MIN(created_at) as first_entry,
  MAX(created_at) as last_entry
FROM collector_ledger_entries
WHERE transaction_type = 'payout_earned' AND currency = 'USD'
GROUP BY collector_identifier
ORDER BY entry_count DESC
LIMIT 20;

-- Check 3: For Carsten Gueth specifically - what should the collector identifier be?
SELECT 
  v.vendor_name,
  v.auth_id,
  v.id as vendor_id,
  COALESCE(v.auth_id::TEXT, v.vendor_name) as expected_collector_identifier,
  (SELECT COUNT(*) FROM collector_ledger_entries 
   WHERE collector_identifier = COALESCE(v.auth_id::TEXT, v.vendor_name)
   AND transaction_type = 'payout_earned' AND currency = 'USD') as entries_found
FROM vendors v
WHERE v.vendor_name = 'Carsten Gueth';

-- Check 4: What fulfilled line items exist for Carsten Gueth?
SELECT 
  oli.line_item_id,
  oli.order_id,
  oli.vendor_name,
  oli.price,
  oli.fulfillment_status,
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
      WHERE (
        cle.line_item_id = oli.line_item_id::TEXT
        OR cle.line_item_id = oli.line_item_id::BIGINT::TEXT
      )
      AND cle.transaction_type = 'payout_earned'
      AND cle.currency = 'USD'
    ) THEN 'IN LEDGER'
    ELSE 'MISSING'
  END as ledger_status
FROM order_line_items_v2 oli
LEFT JOIN product_vendor_payouts pvp 
  ON oli.product_id::TEXT = pvp.product_id::TEXT 
  AND oli.vendor_name = pvp.vendor_name
WHERE 
  oli.vendor_name = 'Carsten Gueth'
  AND oli.fulfillment_status = 'fulfilled'
ORDER BY oli.created_at DESC
LIMIT 10;

-- Check 5: Check if there are any errors in the migration by looking at recent entries
SELECT 
  'Recent Ledger Activity' as check_name,
  COUNT(*) as entries_last_hour,
  COUNT(DISTINCT collector_identifier) as unique_collectors
FROM collector_ledger_entries
WHERE created_at > NOW() - INTERVAL '1 hour';

