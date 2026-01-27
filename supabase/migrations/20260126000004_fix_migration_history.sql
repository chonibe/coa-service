-- Fix Migration History Conflicts
-- This script repairs the schema_migrations table to resolve duplicate key conflicts
-- Date: 2026-01-26

BEGIN;

-- Remove duplicates, keeping only the most recent one
DELETE FROM supabase_migrations.schema_migrations
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY version ORDER BY inserted_at DESC) as rn
    FROM supabase_migrations.schema_migrations
  ) ranked
  WHERE rn > 1
);

-- Mark all missing migrations as applied (they exist in remote but not in history)
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('20260108000000', 'fix_multi_currency_logic', ''),
  ('20260108000001', 'robust_release_notes', ''),
  ('20260108000002', 'dynamic_exchange_rates', ''),
  ('20260108000005', 'case_insensitive_collector_view', ''),
  ('20260108000006', 'pii_bridge_trigger', ''),
  ('20260108000007', 'add_unique_line_item_id', ''),
  ('20260108000008', 'improve_collector_view', ''),
  ('20260108000009', 'strict_edition_counting', ''),
  ('20260108000010', 'unified_deduplicated_view', ''),
  ('20260108000011', 'exclude_invalid_orders_from_editions', ''),
  ('20260109000000', 'add_kickstarter_fields', ''),
  ('20260109000001', 'add_recent_release_notes', ''),
  ('20260109000002', 'exclude_street_collector_from_editions', ''),
  ('20260109000003', 'fix_collector_view_ghost_profile', ''),
  ('20260109000004', 'fix_collector_view_fallback', ''),
  ('20260109000005', 'fix_collector_view_joins', ''),
  ('20260109000006', 'final_pii_fallback', ''),
  ('20260109000007', 'consolidated_profile_view', ''),
  ('20260109000008', 'comprehensive_view_with_shopify_id', ''),
  ('20260109000009', 'view_with_order_name_linkage', ''),
  ('20260109120846', 'add_source_to_orders', ''),
  ('20260109123837', 'add_contact_info_to_orders', ''),
  ('20260109150000', 'fix_assign_edition_rpc', ''),
  ('20260109151000', 'exclude_street_collector_refined', ''),
  ('20260109152000', 'allow_street_collector_editions', ''),
  ('20260109153000', 'restore_edition_logic_strict', ''),
  ('20260124000001', 'add_vendor_signature', ''),
  ('20260124000002', 'add_content_block_fields', ''),
  ('20260124000003', 'add_analytics_and_auth_code', ''),
  ('20260124000004', 'add_collector_auth_notifications', ''),
  ('20260124000005', 'generate_auth_codes', ''),
  ('20260125000001', 'ensure_content_block_fields', ''),
  ('20260125000002', 'add_smart_collection_support', ''),
  ('20260125', 'create_polaris_updates_table', '')
ON CONFLICT (version) DO NOTHING;

COMMIT;
