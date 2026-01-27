-- Cleanup Duplicate Migration Entries
-- This removes any duplicate entries in schema_migrations
-- Must run before other migrations to prevent conflicts

DO $$
DECLARE
  dup_count integer;
BEGIN
  -- Check if there are any duplicates by version
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT version, COUNT(*) as cnt
    FROM supabase_migrations.schema_migrations
    GROUP BY version
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF dup_count > 0 THEN
    -- Delete all entries for versions that have duplicates, we'll re-add them properly
    DELETE FROM supabase_migrations.schema_migrations
    WHERE version IN (
      SELECT version
      FROM supabase_migrations.schema_migrations
      GROUP BY version
      HAVING COUNT(*) > 1
    );
    
    RAISE NOTICE 'Removed % duplicate migration entries', dup_count;
  END IF;
END $$;

-- Now re-insert the migrations that were removed, keeping only one entry per version
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
SELECT DISTINCT ON (version)
  version,
  name,
  statements
FROM supabase_migrations.schema_migrations
WHERE version IN (
  -- Get versions that might have been in the deleted duplicates
  SELECT DISTINCT version FROM (
    VALUES 
      ('20260108000000'),
      ('20260108000001'),
      ('20260108000002'),
      ('20260108000005'),
      ('20260108000006'),
      ('20260108000007'),
      ('20260108000008'),
      ('20260108000009'),
      ('20260108000010'),
      ('20260108000011')
  ) AS t(version)
)
ON CONFLICT (version) DO NOTHING;

-- Mark all missing migrations as applied
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('20260108000000', 'fix_multi_currency_logic', '{}'),
  ('20260108000001', 'robust_release_notes', '{}'),
  ('20260108000002', 'dynamic_exchange_rates', '{}'),
  ('20260108000005', 'case_insensitive_collector_view', '{}'),
  ('20260108000006', 'pii_bridge_trigger', '{}'),
  ('20260108000007', 'add_unique_line_item_id', '{}'),
  ('20260108000008', 'improve_collector_view', '{}'),
  ('20260108000009', 'strict_edition_counting', '{}'),
  ('20260108000010', 'unified_deduplicated_view', '{}'),
  ('20260108000011', 'exclude_invalid_orders_from_editions', '{}'),
  ('20260109000000', 'add_kickstarter_fields', '{}'),
  ('20260109000001', 'add_recent_release_notes', '{}'),
  ('20260109000002', 'exclude_street_collector_from_editions', '{}'),
  ('20260109000003', 'fix_collector_view_ghost_profile', '{}'),
  ('20260109000004', 'fix_collector_view_fallback', '{}'),
  ('20260109000005', 'fix_collector_view_joins', '{}'),
  ('20260109000006', 'final_pii_fallback', '{}'),
  ('20260109000007', 'consolidated_profile_view', '{}'),
  ('20260109000008', 'comprehensive_view_with_shopify_id', '{}'),
  ('20260109000009', 'view_with_order_name_linkage', '{}'),
  ('20260109120846', 'add_source_to_orders', '{}'),
  ('20260109123837', 'add_contact_info_to_orders', '{}'),
  ('20260109150000', 'fix_assign_edition_rpc', '{}'),
  ('20260109151000', 'exclude_street_collector_refined', '{}'),
  ('20260109152000', 'allow_street_collector_editions', '{}'),
  ('20260109153000', 'restore_edition_logic_strict', '{}'),
  ('20260124000001', 'add_vendor_signature', '{}'),
  ('20260124000002', 'add_content_block_fields', '{}'),
  ('20260124000003', 'add_analytics_and_auth_code', '{}'),
  ('20260124000004', 'add_collector_auth_notifications', '{}'),
  ('20260124000005', 'generate_auth_codes', '{}'),
  ('20260125000001', 'ensure_content_block_fields', '{}'),
  ('20260125000002', 'add_smart_collection_support', '{}'),
  ('20260125', 'create_polaris_updates_table', '{}'),
  ('20260107000000', 'fix_migration_history', '{}'),
  ('20260126000004', 'fix_migration_history', '{}')
ON CONFLICT (version) DO NOTHING;
