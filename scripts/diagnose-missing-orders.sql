-- Diagnostic Script: Find Missing Orders in Collector CRM
-- This script identifies orders that are missing from collector profiles due to NULL customer_email

-- ==================================================
-- STEP 1: Count orders missing customer_email
-- ==================================================
SELECT 
  'Orders missing customer_email' as issue,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE financial_status = 'paid') as paid_orders,
  COUNT(*) FILTER (WHERE fulfillment_status IS NOT NULL) as fulfilled_orders
FROM orders
WHERE customer_email IS NULL OR customer_email = '';

-- ==================================================
-- STEP 2: Check which can be enriched from warehouse
-- ==================================================
SELECT 
  'Orders that CAN be enriched from warehouse' as status,
  COUNT(DISTINCT o.id) as count
FROM orders o
WHERE (o.customer_email IS NULL OR o.customer_email = '')
  AND EXISTS (
    SELECT 1 FROM warehouse_orders wo
    WHERE (wo.order_id = o.order_name OR wo.shopify_order_id = o.id)
      AND wo.ship_email IS NOT NULL
      AND wo.ship_email != ''
  );

-- ==================================================
-- STEP 3: Show sample orders that need enrichment
-- ==================================================
SELECT 
  o.id,
  o.order_name,
  o.order_number,
  o.processed_at,
  o.financial_status,
  o.fulfillment_status,
  o.total_price,
  o.customer_email as current_email,
  wo.ship_email as warehouse_email,
  wo.ship_name as warehouse_name,
  wo.order_id as warehouse_order_id
FROM orders o
LEFT JOIN warehouse_orders wo ON (wo.order_id = o.order_name OR wo.shopify_order_id = o.id)
WHERE (o.customer_email IS NULL OR o.customer_email = '')
  AND wo.ship_email IS NOT NULL
ORDER BY o.processed_at DESC
LIMIT 20;

-- ==================================================
-- STEP 4: Check for orphaned warehouse orders (no Shopify match)
-- ==================================================
SELECT 
  'Warehouse orders without Shopify match' as status,
  COUNT(*) as count,
  array_agg(wo.order_id ORDER BY wo.created_at DESC) FILTER (WHERE wo.created_at > NOW() - INTERVAL '30 days') as recent_examples
FROM warehouse_orders wo
WHERE wo.shopify_order_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.order_name = wo.order_id
  );

-- ==================================================
-- STEP 5: Check collector profile stats before enrichment
-- ==================================================
SELECT 
  COUNT(*) as total_collector_profiles,
  COUNT(*) FILTER (WHERE total_orders = 0) as profiles_with_zero_orders,
  COUNT(*) FILTER (WHERE total_orders > 0 AND total_editions = 0) as profiles_with_orders_no_editions,
  AVG(total_orders) as avg_orders_per_collector,
  AVG(total_spent) as avg_spent_per_collector
FROM collector_profile_comprehensive;

-- ==================================================
-- STEP 6: Find specific collectors affected
-- ==================================================
SELECT 
  user_email,
  display_name,
  total_orders,
  total_editions,
  total_spent,
  last_purchase_date
FROM collector_profile_comprehensive
WHERE total_orders = 0
  AND user_email IN (
    SELECT DISTINCT LOWER(wo.ship_email)
    FROM warehouse_orders wo
    WHERE wo.ship_email IS NOT NULL
  )
ORDER BY user_email
LIMIT 20;

-- ==================================================
-- STEP 7: Check if enrichment trigger exists and is active
-- ==================================================
SELECT 
  t.tgname as trigger_name,
  t.tgenabled as enabled,
  pg_get_triggerdef(t.oid) as definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'warehouse_orders'
  AND t.tgname = 'tr_warehouse_enrichment';
