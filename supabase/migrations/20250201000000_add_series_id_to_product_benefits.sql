-- Migration to add series_id support to product_benefits table
-- Allows benefits to be associated with either a product (artwork-level) or a series (series-level)

-- Add series_id column to product_benefits table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_benefits' AND column_name = 'series_id'
  ) THEN
    ALTER TABLE product_benefits 
    ADD COLUMN series_id UUID REFERENCES artwork_series(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index on series_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_product_benefits_series_id 
ON product_benefits(series_id) 
WHERE series_id IS NOT NULL;

-- Add hidden_series_id column for "Hidden Series" benefit type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_benefits' AND column_name = 'hidden_series_id'
  ) THEN
    ALTER TABLE product_benefits 
    ADD COLUMN hidden_series_id UUID REFERENCES artwork_series(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index on hidden_series_id
CREATE INDEX IF NOT EXISTS idx_product_benefits_hidden_series_id 
ON product_benefits(hidden_series_id) 
WHERE hidden_series_id IS NOT NULL;

-- Add constraint to ensure either product_id OR series_id is provided (but not both)
-- Note: product_id is currently NOT NULL, so we'll make it nullable and add a check constraint
DO $$
BEGIN
  -- Make product_id nullable if it's not already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_benefits' 
    AND column_name = 'product_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE product_benefits 
    ALTER COLUMN product_id DROP NOT NULL;
  END IF;

  -- Add check constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'product_benefits_product_or_series_check'
  ) THEN
    ALTER TABLE product_benefits 
    ADD CONSTRAINT product_benefits_product_or_series_check 
    CHECK (
      (product_id IS NOT NULL AND series_id IS NULL) OR 
      (product_id IS NULL AND series_id IS NOT NULL)
    );
  END IF;
END $$;

