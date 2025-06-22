-- Standardize product_id to TEXT in both tables
ALTER TABLE products
ALTER COLUMN product_id TYPE TEXT
USING product_id::TEXT;

ALTER TABLE order_line_items
ALTER COLUMN product_id TYPE TEXT
USING product_id::TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id);
CREATE INDEX IF NOT EXISTS idx_order_line_items_product_id ON order_line_items(product_id); 