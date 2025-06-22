-- Add foreign key constraint for product_id in order_line_items
ALTER TABLE order_line_items
ADD CONSTRAINT fk_order_line_items_product_id
FOREIGN KEY (product_id)
REFERENCES products(id)
ON DELETE SET NULL;

-- Add index for better join performance
CREATE INDEX IF NOT EXISTS idx_order_line_items_product_id ON order_line_items(product_id); 