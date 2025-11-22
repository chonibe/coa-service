-- Add foreign key constraint for product_id in order_line_items_v2
-- NOTE: Commented out due to type mismatch (product_id is TEXT, products.id is UUID/BIGINT)
-- ALTER TABLE order_line_items_v2
-- ADD CONSTRAINT fk_order_line_items_v2_product_id
-- FOREIGN KEY (product_id)
-- REFERENCES products(id)
-- ON DELETE SET NULL;

-- Add index for better join performance
CREATE INDEX IF NOT EXISTS idx_order_line_items_v2_product_id ON order_line_items_v2(product_id); 