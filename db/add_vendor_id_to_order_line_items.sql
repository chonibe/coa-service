-- Add vendor_id column to order_line_items table
ALTER TABLE order_line_items ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES vendors (id);

-- Backfill vendor_id based on product_id and vendor_name
UPDATE order_line_items
SET vendor_id = (
 SELECT id
 FROM vendors
 WHERE vendors.vendor_name = order_line_items.vendor_name
)
WHERE vendor_id IS NULL;

-- Create index on vendor_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_line_items_vendor_id ON order_line_items(vendor_id);
