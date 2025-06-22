-- Ensure product_id is TEXT and trimmed in both tables
ALTER TABLE products
ALTER COLUMN product_id TYPE TEXT USING TRIM(product_id);

ALTER TABLE order_line_items
ALTER COLUMN product_id TYPE TEXT USING TRIM(product_id);

-- Remove rows with null or empty product_id
DELETE FROM products WHERE product_id IS NULL OR TRIM(product_id) = '';
DELETE FROM order_line_items WHERE product_id IS NULL OR TRIM(product_id) = '';

-- Add constraints to ensure product_id is always a non-empty string
ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_product_id_not_empty,
ADD CONSTRAINT products_product_id_not_empty CHECK (product_id IS NOT NULL AND TRIM(product_id) <> '');

ALTER TABLE order_line_items
DROP CONSTRAINT IF EXISTS oli_product_id_not_empty,
ADD CONSTRAINT oli_product_id_not_empty CHECK (product_id IS NOT NULL AND TRIM(product_id) <> '');

-- Create an index on product_id for better performance
CREATE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id);
CREATE INDEX IF NOT EXISTS idx_order_line_items_product_id ON order_line_items(product_id); 