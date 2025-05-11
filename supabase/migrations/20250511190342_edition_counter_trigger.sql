-- 1. Add the edition_counter column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS edition_counter BIGINT DEFAULT 0;

-- 2. Create the trigger function
CREATE OR REPLACE FUNCTION update_edition_counter()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET edition_counter = (
    SELECT COUNT(*) FROM order_line_items_v2
    WHERE product_id = NEW.product_id AND edition_number IS NOT NULL
  )
  WHERE product_id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach the trigger to order_line_items_v2 for insert, update, and delete
DROP TRIGGER IF EXISTS trg_update_edition_counter_insert ON order_line_items_v2;
CREATE TRIGGER trg_update_edition_counter_insert
AFTER INSERT ON order_line_items_v2
FOR EACH ROW EXECUTE FUNCTION update_edition_counter();

DROP TRIGGER IF EXISTS trg_update_edition_counter_update ON order_line_items_v2;
CREATE TRIGGER trg_update_edition_counter_update
AFTER UPDATE ON order_line_items_v2
FOR EACH ROW EXECUTE FUNCTION update_edition_counter();

DROP TRIGGER IF EXISTS trg_update_edition_counter_delete ON order_line_items_v2;
CREATE TRIGGER trg_update_edition_counter_delete
AFTER DELETE ON order_line_items_v2
FOR EACH ROW EXECUTE FUNCTION update_edition_counter();

-- 4. Backfill edition_counter for all products
UPDATE products SET edition_counter = (
  SELECT COUNT(*) FROM order_line_items_v2
  WHERE order_line_items_v2.product_id = products.product_id AND edition_number IS NOT NULL
); 