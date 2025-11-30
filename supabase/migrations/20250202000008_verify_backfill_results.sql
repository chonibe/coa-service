-- ============================================
-- Verify Backfill Results
-- ============================================
-- Run this to check if the backfill migration actually created entries
-- ============================================

-- Check 1: How many ledger entries were created?
SELECT 
  'Total Ledger Entries' as check_name,
  COUNT(*) as total_entries,
  COUNT(DISTINCT collector_identifier) as unique_collectors,
  SUM(amount) as total_amount
FROM collector_ledger_entries
WHERE 
  transaction_type = 'payout_earned'
  AND currency = 'USD';

-- Check 2: Sample of ledger entries (first 10)
SELECT 
  id,
  collector_identifier,
  amount,
  order_id,
  line_item_id,
  description,
  created_at
FROM collector_ledger_entries
WHERE 
  transaction_type = 'payout_earned'
  AND currency = 'USD'
ORDER BY created_at DESC
LIMIT 10;

-- Check 3: Compare vendor names with collector identifiers
SELECT 
  v.vendor_name,
  v.auth_id,
  COALESCE(v.auth_id::TEXT, v.vendor_name) as expected_collector_identifier,
  COUNT(cle.id) as ledger_entries_count,
  COALESCE(SUM(cle.amount), 0) as total_in_ledger
FROM vendors v
LEFT JOIN collector_ledger_entries cle 
  ON cle.collector_identifier = COALESCE(v.auth_id::TEXT, v.vendor_name)
  AND cle.transaction_type = 'payout_earned'
  AND cle.currency = 'USD'
WHERE v.vendor_name IN (
  SELECT DISTINCT vendor_name 
  FROM order_line_items_v2 
  WHERE fulfillment_status = 'fulfilled' 
    AND vendor_name IS NOT NULL
)
GROUP BY v.vendor_name, v.auth_id
ORDER BY total_in_ledger DESC
LIMIT 20;

-- Check 4: Are there any ledger entries that don't match vendors?
SELECT 
  cle.collector_identifier,
  COUNT(*) as entry_count,
  SUM(cle.amount) as total_amount
FROM collector_ledger_entries cle
WHERE 
  cle.transaction_type = 'payout_earned'
  AND cle.currency = 'USD'
  AND NOT EXISTS (
    SELECT 1 
    FROM vendors v 
    WHERE COALESCE(v.auth_id::TEXT, v.vendor_name) = cle.collector_identifier
  )
GROUP BY cle.collector_identifier
LIMIT 10;

-- Check 5: Check if collector accounts exist
SELECT 
  ca.collector_identifier,
  ca.account_type,
  ca.vendor_id,
  COUNT(cle.id) as ledger_entry_count,
  COALESCE(SUM(cle.amount), 0) as total_balance
FROM collector_accounts ca
LEFT JOIN collector_ledger_entries cle 
  ON cle.collector_identifier = ca.collector_identifier
  AND cle.transaction_type = 'payout_earned'
  AND cle.currency = 'USD'
WHERE ca.account_type = 'vendor'
GROUP BY ca.collector_identifier, ca.account_type, ca.vendor_id
ORDER BY total_balance DESC
LIMIT 20;

