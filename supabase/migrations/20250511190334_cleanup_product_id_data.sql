-- Remove rows with null or empty product_id
DELETE FROM products WHERE product_id IS NULL OR TRIM(product_id) = '';
DELETE FROM order_line_items_v2 WHERE product_id IS NULL OR TRIM(product_id) = '';

-- Add constraints to ensure product_id is always non-empty
ALTER TABLE products
ADD CONSTRAINT products_product_id_not_empty CHECK (TRIM(product_id) <> '');

ALTER TABLE order_line_items_v2
ADD CONSTRAINT oli_product_id_not_empty CHECK (TRIM(product_id) <> ''); 