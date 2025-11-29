-- Migration: Add circular benefit fields to product_benefits
-- Enables benefits to connect to other artworks, series, credits, and drop dates

-- Add vip_artwork_id for unlocking specific artwork from VIP series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_benefits' AND column_name = 'vip_artwork_id'
  ) THEN
    ALTER TABLE product_benefits 
    ADD COLUMN vip_artwork_id TEXT; -- References vendor_product_submissions.id
  END IF;
END $$;

-- Add credits_amount for credits bonus benefits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_benefits' AND column_name = 'credits_amount'
  ) THEN
    ALTER TABLE product_benefits 
    ADD COLUMN credits_amount INTEGER; -- Amount of credits to grant
  END IF;
END $$;

-- Add drop_date for early drop access benefits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_benefits' AND column_name = 'drop_date'
  ) THEN
    ALTER TABLE product_benefits 
    ADD COLUMN drop_date TIMESTAMP WITH TIME ZONE; -- Early access drop date
  END IF;
END $$;

-- Add exclusive_visibility_series_id for exclusive visibility benefits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_benefits' AND column_name = 'exclusive_visibility_series_id'
  ) THEN
    ALTER TABLE product_benefits 
    ADD COLUMN exclusive_visibility_series_id UUID REFERENCES artwork_series(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_product_benefits_vip_artwork_id 
ON product_benefits(vip_artwork_id) 
WHERE vip_artwork_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_benefits_drop_date 
ON product_benefits(drop_date) 
WHERE drop_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_benefits_exclusive_visibility_series_id 
ON product_benefits(exclusive_visibility_series_id) 
WHERE exclusive_visibility_series_id IS NOT NULL;

