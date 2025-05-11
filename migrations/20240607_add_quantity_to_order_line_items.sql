-- Add quantity column to order_line_items
ALTER TABLE order_line_items
ADD COLUMN quantity integer; 