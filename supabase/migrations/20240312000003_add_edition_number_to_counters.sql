-- Add edition_number column to product_edition_counters
ALTER TABLE product_edition_counters
ADD COLUMN IF NOT EXISTS edition_number INTEGER;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_edition_counters_edition_number ON product_edition_counters(edition_number); 