-- Migration: Add content block fields to product_benefits table
-- Enables artwork page content blocks with ordering, configuration, and publishing status

-- Add display_order column for content block ordering
ALTER TABLE product_benefits
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add block_config JSONB column for video URLs, audio URLs, etc.
ALTER TABLE product_benefits
ADD COLUMN IF NOT EXISTS block_config JSONB;

-- Add is_published boolean for draft/publish workflow
ALTER TABLE product_benefits
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- Note: series_id already exists from migration 20250201000000_add_series_id_to_product_benefits.sql
-- Verify it exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_benefits' AND column_name = 'series_id'
  ) THEN
    ALTER TABLE product_benefits 
    ADD COLUMN series_id UUID REFERENCES artwork_series(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_product_benefits_series_id 
    ON product_benefits(series_id) 
    WHERE series_id IS NOT NULL;
  END IF;
END $$;

-- Create index on display_order for efficient sorting
CREATE INDEX IF NOT EXISTS idx_product_benefits_display_order 
ON product_benefits(product_id, display_order) 
WHERE product_id IS NOT NULL;

-- Create index on is_published for filtering
CREATE INDEX IF NOT EXISTS idx_product_benefits_is_published 
ON product_benefits(is_published) 
WHERE is_published = true;

-- Add new benefit types for artwork page content blocks
INSERT INTO benefit_types (name, description, icon)
VALUES 
    ('Artwork Text Block', 'Text content for the artwork page', 'type'),
    ('Artwork Image Block', 'Image content for the artwork page', 'image'),
    ('Artwork Video Block', 'Video link for the artwork page', 'video'),
    ('Artwork Audio Block', 'Audio message for the artwork page', 'music')
ON CONFLICT (name) DO NOTHING;

-- Add comments for documentation
COMMENT ON COLUMN product_benefits.display_order IS 'Order in which content blocks appear on artwork page (lower numbers first)';
COMMENT ON COLUMN product_benefits.block_config IS 'JSON configuration for block-specific settings (e.g., video URLs, audio URLs, image captions)';
COMMENT ON COLUMN product_benefits.is_published IS 'Whether this content block is published and visible to collectors (false = draft)';
