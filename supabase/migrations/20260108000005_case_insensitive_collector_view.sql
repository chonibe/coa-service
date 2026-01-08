-- Migration: Case-insensitive Collector Profile Aggregation View
-- Lowercase existing email data and update view for robust matching

-- 1. Lowercase existing data to ensure consistency
UPDATE public.orders SET customer_email = LOWER(customer_email) WHERE customer_email IS NOT NULL;
UPDATE public.warehouse_orders SET ship_email = LOWER(ship_email) WHERE ship_email IS NOT NULL;
UPDATE public.collector_profiles SET email = LOWER(email) WHERE email IS NOT NULL;
UPDATE public.order_line_items_v2 SET owner_email = LOWER(owner_email) WHERE owner_email IS NOT NULL;

-- 2. Drop if exists
DROP VIEW IF EXISTS collector_profile_comprehensive;

-- 3. Create view with case-insensitive matching (using LOWER everywhere)
CREATE OR REPLACE VIEW collector_profile_comprehensive AS
WITH contact_base AS (
  SELECT LOWER(email) as email FROM auth.users WHERE email IS NOT NULL
  UNION
  SELECT LOWER(customer_email) as email FROM orders WHERE customer_email IS NOT NULL
  UNION
  SELECT LOWER(ship_email) as email FROM warehouse_orders WHERE ship_email IS NOT NULL
)
SELECT
  -- Primary Identifier
  cb.email as user_email,
  
  -- User Info (if exists)
  u.id as user_id,
  u.created_at as user_created_at,

  -- Collector Profile (if exists)
  cp.id as profile_id,
  cp.first_name,
  cp.last_name,
  cp.email as profile_email,
  cp.phone as profile_phone,
  cp.bio,
  cp.avatar_url,
  cp.created_at as profile_created_at,
  cp.updated_at as profile_updated_at,

  -- Computed Display Fields
  COALESCE(
    TRIM(cp.first_name || ' ' || cp.last_name),
    (SELECT TRIM(wo.ship_name) FROM warehouse_orders wo WHERE LOWER(wo.ship_email) = cb.email AND wo.ship_name IS NOT NULL ORDER BY wo.created_at DESC LIMIT 1),
    (SELECT TRIM(concat_ws(' ', raw_shopify_order_data->'customer'->>'first_name', raw_shopify_order_data->'customer'->>'last_name')) FROM orders o WHERE LOWER(o.customer_email) = cb.email AND raw_shopify_order_data->'customer' IS NOT NULL ORDER BY o.processed_at DESC LIMIT 1),
    cb.email
  ) as display_name,

  COALESCE(
    cp.phone,
    (SELECT wo.ship_phone FROM warehouse_orders wo WHERE LOWER(wo.ship_email) = cb.email AND wo.ship_phone IS NOT NULL ORDER BY wo.created_at DESC LIMIT 1),
    (SELECT raw_shopify_order_data->'customer'->>'phone' FROM orders o WHERE LOWER(o.customer_email) = cb.email AND raw_shopify_order_data->'customer'->>'phone' IS NOT NULL ORDER BY o.processed_at DESC LIMIT 1)
  ) as display_phone,

  -- Statistics
  (SELECT COUNT(oli.id) FROM order_line_items_v2 oli WHERE (oli.owner_id = u.id OR (oli.owner_id IS NULL AND LOWER(oli.owner_email) = cb.email)) AND oli.status = 'active') as total_editions,
  (SELECT COUNT(oli.id) FROM order_line_items_v2 oli WHERE (oli.owner_id = u.id OR (oli.owner_id IS NULL AND LOWER(oli.owner_email) = cb.email)) AND oli.status = 'active' AND oli.nfc_claimed_at IS NOT NULL) as authenticated_editions,
  (SELECT COUNT(o.id) FROM orders o WHERE LOWER(o.customer_email) = cb.email) as total_orders,
  (SELECT COALESCE(SUM(o.total_price), 0) FROM orders o WHERE LOWER(o.customer_email) = cb.email) as total_spent,
  (SELECT MIN(o.processed_at) FROM orders o WHERE LOWER(o.customer_email) = cb.email) as first_purchase_date,
  (SELECT MAX(o.processed_at) FROM orders o WHERE LOWER(o.customer_email) = cb.email) as last_purchase_date,
  (SELECT COUNT(cpc.id) FROM collector_profile_changes cpc WHERE cpc.user_id = u.id) as profile_changes_count,

  -- PII Sources as JSON
  json_build_object(
    'profile', CASE WHEN cp.id IS NOT NULL THEN
      json_build_object(
        'source', 'collector_profile',
        'first_name', cp.first_name,
        'last_name', cp.last_name,
        'email', cp.email,
        'phone', cp.phone,
        'bio', cp.bio,
        'avatar_url', cp.avatar_url,
        'updated_at', cp.updated_at
      )
    ELSE NULL END,

    'shopify', (
      SELECT
        json_build_object(
          'source', 'shopify_customer',
          'first_name', raw_shopify_order_data->'customer'->>'first_name',
          'last_name', raw_shopify_order_data->'customer'->>'last_name',
          'email', raw_shopify_order_data->'customer'->>'email',
          'phone', raw_shopify_order_data->'customer'->>'phone',
          'address', raw_shopify_order_data->'customer'->'default_address'
        )
      FROM orders o
      WHERE LOWER(o.customer_email) = cb.email AND raw_shopify_order_data->'customer' IS NOT NULL
      ORDER BY o.processed_at DESC
      LIMIT 1
    ),

    'warehouse', (
      SELECT
        json_build_object(
          'source', 'warehouse_order',
          'first_name', wo.ship_name,
          'last_name', NULL,
          'email', wo.ship_email,
          'phone', wo.ship_phone,
          'address', wo.ship_address,
          'tracking_number', wo.tracking_number,
          'status', wo.status,
          'status_name', wo.status_name
        )
      FROM warehouse_orders wo
      WHERE LOWER(wo.ship_email) = cb.email
      ORDER BY wo.created_at DESC
      LIMIT 1
    )
  ) as pii_sources

FROM contact_base cb
LEFT JOIN auth.users u ON LOWER(u.email) = cb.email
LEFT JOIN collector_profiles cp ON cp.user_id = u.id;

COMMENT ON VIEW collector_profile_comprehensive IS 'Case-insensitive aggregated view of collector profiles combining auth, custom profile, shopify, and warehouse data.';


