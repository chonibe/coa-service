-- First, ensure all product_id values can be cast to BIGINT
DELETE FROM products WHERE product_id IS NULL OR NOT (product_id ~ '^[0-9]+$');
DELETE FROM order_line_items WHERE product_id IS NULL OR NOT (product_id ~ '^[0-9]+$');

-- Create temporary columns for the conversion
ALTER TABLE products ADD COLUMN product_id_new BIGINT;
ALTER TABLE order_line_items ADD COLUMN product_id_new BIGINT;

-- Convert the values
UPDATE products SET product_id_new = product_id::BIGINT;
UPDATE order_line_items SET product_id_new = product_id::BIGINT;

-- Drop the old columns and rename the new ones
ALTER TABLE products DROP COLUMN product_id;
ALTER TABLE products RENAME COLUMN product_id_new TO product_id;

ALTER TABLE order_line_items DROP COLUMN product_id;
ALTER TABLE order_line_items RENAME COLUMN product_id_new TO product_id;

-- Add constraints to ensure product_id is always a positive number
ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_product_id_not_empty,
ADD CONSTRAINT products_product_id_positive CHECK (product_id > 0);

ALTER TABLE order_line_items
DROP CONSTRAINT IF EXISTS oli_product_id_not_empty,
ADD CONSTRAINT oli_product_id_positive CHECK (product_id > 0);

-- Create an index on product_id for better performance
CREATE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id);
CREATE INDEX IF NOT EXISTS idx_order_line_items_product_id ON order_line_items(product_id); 