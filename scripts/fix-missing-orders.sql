-- Fix Script: Populate Missing customer_email from warehouse_orders
-- This implements the PII Bridge enrichment directly in SQL
-- Run this AFTER reviewing the diagnostic script results

-- ==================================================
-- STEP 1: Backup current state (optional but recommended)
-- ==================================================
-- Uncomment if you want to create a backup table first:
-- CREATE TABLE orders_backup_before_enrichment AS SELECT * FROM orders WHERE customer_email IS NULL;

-- ==================================================
-- STEP 2: Enrich orders from warehouse_orders by order_name match
-- ==================================================
WITH enrichment_candidates AS (
  SELECT DISTINCT
    o.id as order_id,
    LOWER(TRIM(wo.ship_email)) as new_email,
    wo.ship_name,
    wo.order_id as warehouse_order_id
  FROM orders o
  JOIN warehouse_orders wo ON wo.order_id = o.order_name
  WHERE (o.customer_email IS NULL OR o.customer_email = '')
    AND wo.ship_email IS NOT NULL
    AND wo.ship_email != ''
    AND LOWER(TRIM(wo.ship_email)) ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' -- Valid email format
)
UPDATE orders
SET 
  customer_email = ec.new_email,
  updated_at = NOW()
FROM enrichment_candidates ec
WHERE orders.id = ec.order_id;

-- ==================================================
-- STEP 3: Enrich orders from warehouse_orders by shopify_order_id match
-- ==================================================
WITH enrichment_candidates AS (
  SELECT DISTINCT
    o.id as order_id,
    LOWER(TRIM(wo.ship_email)) as new_email,
    wo.ship_name,
    wo.shopify_order_id
  FROM orders o
  JOIN warehouse_orders wo ON wo.shopify_order_id = o.id
  WHERE (o.customer_email IS NULL OR o.customer_email = '')
    AND wo.ship_email IS NOT NULL
    AND wo.ship_email != ''
    AND LOWER(TRIM(wo.ship_email)) ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
)
UPDATE orders
SET 
  customer_email = ec.new_email,
  updated_at = NOW()
FROM enrichment_candidates ec
WHERE orders.id = ec.order_id;

-- ==================================================
-- STEP 4: Populate owner_email in order_line_items_v2 for newly enriched orders
-- ==================================================
WITH newly_enriched AS (
  SELECT DISTINCT
    o.id as order_id,
    o.customer_email
  FROM orders o
  WHERE o.customer_email IS NOT NULL
    AND o.updated_at > NOW() - INTERVAL '5 minutes' -- Recently updated
)
UPDATE order_line_items_v2 oli
SET 
  owner_email = ne.customer_email,
  updated_at = NOW()
FROM newly_enriched ne
WHERE oli.order_id = ne.order_id
  AND (oli.owner_email IS NULL OR oli.owner_email = '');

-- ==================================================
-- STEP 5: Update owner_id where possible (if user exists with that email)
-- ==================================================
WITH email_to_user AS (
  SELECT DISTINCT
    LOWER(email) as email,
    id as user_id
  FROM auth.users
  WHERE email IS NOT NULL
)
UPDATE order_line_items_v2 oli
SET 
  owner_id = eu.user_id,
  updated_at = NOW()
FROM email_to_user eu
WHERE LOWER(oli.owner_email) = eu.email
  AND oli.owner_id IS NULL;

-- ==================================================
-- STEP 6: Show enrichment results
-- ==================================================
SELECT 
  'Enrichment Complete' as status,
  COUNT(*) as orders_now_with_email,
  COUNT(DISTINCT customer_email) as unique_customers,
  COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '5 minutes') as just_enriched
FROM orders
WHERE customer_email IS NOT NULL AND customer_email != '';

-- ==================================================
-- STEP 7: Show remaining issues
-- ==================================================
SELECT 
  'Orders still missing email' as status,
  COUNT(*) as count,
  array_agg(order_name ORDER BY processed_at DESC) FILTER (WHERE processed_at > NOW() - INTERVAL '30 days') as recent_examples
FROM orders
WHERE customer_email IS NULL OR customer_email = '';

-- ==================================================
-- STEP 8: Verify trigger is active
-- ==================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'warehouse_orders'
      AND t.tgname = 'tr_warehouse_enrichment'
      AND t.tgenabled = 'O'
  ) THEN
    RAISE NOTICE 'WARNING: PII Bridge trigger is not active. Run migration 20260108000006_pii_bridge_trigger.sql';
  ELSE
    RAISE NOTICE 'SUCCESS: PII Bridge trigger is active and will auto-enrich future orders';
  END IF;
END $$;
