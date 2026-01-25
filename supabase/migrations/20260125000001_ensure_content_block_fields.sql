-- Migration: Ensure content block fields exist in product_benefits table
-- This migration ensures all required columns exist even if previous migration wasn't run

-- Add display_order column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_benefits' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE product_benefits
    ADD COLUMN display_order INTEGER DEFAULT 0;
    
    CREATE INDEX IF NOT EXISTS idx_product_benefits_display_order 
    ON product_benefits(product_id, display_order) 
    WHERE product_id IS NOT NULL;
    
    COMMENT ON COLUMN product_benefits.display_order IS 'Order in which content blocks appear on artwork page (lower numbers first)';
  END IF;
END $$;

-- Add block_config column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_benefits' AND column_name = 'block_config'
  ) THEN
    ALTER TABLE product_benefits
    ADD COLUMN block_config JSONB;
    
    COMMENT ON COLUMN product_benefits.block_config IS 'JSON configuration for block-specific settings (e.g., video URLs, audio URLs, image captions)';
  END IF;
END $$;

-- Add is_published column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_benefits' AND column_name = 'is_published'
  ) THEN
    ALTER TABLE product_benefits
    ADD COLUMN is_published BOOLEAN DEFAULT true;
    
    CREATE INDEX IF NOT EXISTS idx_product_benefits_is_published 
    ON product_benefits(is_published) 
    WHERE is_published = true;
    
    COMMENT ON COLUMN product_benefits.is_published IS 'Whether this content block is published and visible to collectors (false = draft)';
  END IF;
END $$;

-- Ensure series_id exists
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

-- Ensure benefit types exist
INSERT INTO benefit_types (name, description, icon)
VALUES 
    ('Artwork Text Block', 'Text content for the artwork page', 'type'),
    ('Artwork Image Block', 'Image content for the artwork page', 'image'),
    ('Artwork Video Block', 'Video link for the artwork page', 'video'),
    ('Artwork Audio Block', 'Audio message for the artwork page', 'music')
ON CONFLICT (name) DO NOTHING;
