-- Migration: Add vip_series_id to product_benefits for VIP series unlocks
-- Allows VIP unlock to support both artwork and series

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_benefits' AND column_name = 'vip_series_id'
  ) THEN
    ALTER TABLE product_benefits 
    ADD COLUMN vip_series_id UUID REFERENCES artwork_series(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_product_benefits_vip_series_id 
ON product_benefits(vip_series_id) 
WHERE vip_series_id IS NOT NULL;

