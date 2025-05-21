-- Add updated_at column to product_edition_counters
ALTER TABLE product_edition_counters
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to have current timestamp
UPDATE product_edition_counters
SET updated_at = CURRENT_TIMESTAMP
WHERE updated_at IS NULL; 