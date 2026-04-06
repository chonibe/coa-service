-- Pair saturn_png vendor to Shopify collection (admin: .../collections/686811218306)
-- Enables getCollectionById + collection description via vendor_collections.

INSERT INTO public.vendor_collections (
  vendor_id,
  vendor_name,
  shopify_collection_id,
  shopify_collection_handle,
  collection_title
)
SELECT
  v.id,
  v.vendor_name,
  '686811218306',
  'saturn-png',
  COALESCE(v.vendor_name, 'saturn_png') || ' Collection'
FROM public.vendors AS v
WHERE lower(trim(v.vendor_name)) = lower(trim('saturn_png'))
ON CONFLICT (vendor_id) DO UPDATE SET
  vendor_name = EXCLUDED.vendor_name,
  shopify_collection_id = EXCLUDED.shopify_collection_id,
  shopify_collection_handle = EXCLUDED.shopify_collection_handle,
  collection_title = EXCLUDED.collection_title,
  updated_at = now();
