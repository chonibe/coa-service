-- Add vendor_name column to order_line_items table if it doesn't exist
ALTER TABLE order_line_items 
ADD COLUMN IF NOT EXISTS vendor_name TEXT;

-- Create index for faster lookups by vendor_name
CREATE INDEX IF NOT EXISTS idx_order_line_items_vendor_name ON order_line_items(vendor_name);
