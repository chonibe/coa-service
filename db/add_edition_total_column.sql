-- Add edition_total column to order_line_items table if it doesn't exist
ALTER TABLE order_line_items 
ADD COLUMN IF NOT EXISTS edition_total INTEGER;

-- Create index for faster lookups by edition_total
CREATE INDEX IF NOT EXISTS idx_order_line_items_edition_total ON order_line_items(edition_total); 