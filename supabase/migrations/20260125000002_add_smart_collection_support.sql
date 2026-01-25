-- Add smart collection support to artwork_series table
-- Migration: 20260125000002_add_smart_collection_support.sql

-- Add new columns for smart collection functionality
ALTER TABLE artwork_series 
  ADD COLUMN IF NOT EXISTS collection_type TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS smart_conditions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sort_order TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS sync_to_shopify BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS shopify_collection_id TEXT;

-- Add check constraint for collection_type
DO $$ BEGIN
  ALTER TABLE artwork_series 
    ADD CONSTRAINT artwork_series_collection_type_check 
    CHECK (collection_type IN ('manual', 'smart'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add check constraint for sort_order
DO $$ BEGIN
  ALTER TABLE artwork_series 
    ADD CONSTRAINT artwork_series_sort_order_check 
    CHECK (sort_order IN ('manual', 'alphabetical', 'created_desc', 'created_asc', 'price_asc', 'price_desc'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add index for Shopify collection ID lookups
CREATE INDEX IF NOT EXISTS idx_artwork_series_shopify_collection_id 
  ON artwork_series(shopify_collection_id) 
  WHERE shopify_collection_id IS NOT NULL;

-- Add index for collection_type filtering
CREATE INDEX IF NOT EXISTS idx_artwork_series_collection_type 
  ON artwork_series(collection_type);

-- Add GIN index for smart_conditions JSONB queries
CREATE INDEX IF NOT EXISTS idx_artwork_series_smart_conditions 
  ON artwork_series USING GIN (smart_conditions);

-- Add comment explaining the columns
COMMENT ON COLUMN artwork_series.collection_type IS 'Type of collection: manual (artworks added manually) or smart (artworks auto-added by conditions)';
COMMENT ON COLUMN artwork_series.smart_conditions IS 'Array of condition objects for smart collections. Each condition has: field, operator, value';
COMMENT ON COLUMN artwork_series.sort_order IS 'How artworks are sorted in the series: manual, alphabetical, created_desc, created_asc, price_asc, price_desc';
COMMENT ON COLUMN artwork_series.sync_to_shopify IS 'Whether to sync this series as a Shopify collection';
COMMENT ON COLUMN artwork_series.shopify_collection_id IS 'Shopify collection ID if synced to Shopify';
