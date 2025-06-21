-- Update customer_id in order_line_items_v2 from orders table
UPDATE "public"."order_line_items_v2" oli
SET customer_id = o.customer_id::uuid
FROM "public"."orders" o
WHERE oli.order_id = o.id;

-- Create a trigger to keep customer_id in sync
CREATE OR REPLACE FUNCTION sync_customer_id_from_order()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "public"."order_line_items_v2"
  SET customer_id = NEW.customer_id::uuid
  WHERE order_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_customer_id_on_order_update
AFTER UPDATE OF customer_id ON "public"."orders"
FOR EACH ROW
EXECUTE FUNCTION sync_customer_id_from_order(); 