-- Create order_line_items table as a view of order_line_items_v2
CREATE OR REPLACE VIEW "public"."order_line_items" AS 
SELECT 
    id,
    order_id,
    order_name,
    line_item_id,
    product_id,
    variant_id,
    name,
    description,
    price,
    quantity,
    sku,
    vendor_name,
    fulfillment_status,
    status,
    created_at,
    updated_at
FROM "public"."order_line_items_v2";

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."order_line_items" TO authenticated, service_role;

-- Create triggers to make the view updatable
CREATE OR REPLACE FUNCTION order_line_items_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO "public"."order_line_items_v2" (
        order_id,
        order_name,
        line_item_id,
        product_id,
        variant_id,
        name,
        description,
        price,
        quantity,
        sku,
        vendor_name,
        fulfillment_status,
        status
    ) VALUES (
        NEW.order_id,
        NEW.order_name,
        NEW.line_item_id,
        NEW.product_id,
        NEW.variant_id,
        NEW.name,
        NEW.description,
        NEW.price,
        NEW.quantity,
        NEW.sku,
        NEW.vendor_name,
        NEW.fulfillment_status,
        NEW.status
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION order_line_items_update_trigger()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "public"."order_line_items_v2"
    SET 
        order_id = NEW.order_id,
        order_name = NEW.order_name,
        line_item_id = NEW.line_item_id,
        product_id = NEW.product_id,
        variant_id = NEW.variant_id,
        name = NEW.name,
        description = NEW.description,
        price = NEW.price,
        quantity = NEW.quantity,
        sku = NEW.sku,
        vendor_name = NEW.vendor_name,
        fulfillment_status = NEW.fulfillment_status,
        status = NEW.status
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION order_line_items_delete_trigger()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM "public"."order_line_items_v2" WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_line_items_insert
INSTEAD OF INSERT ON "public"."order_line_items"
FOR EACH ROW EXECUTE FUNCTION order_line_items_insert_trigger();

CREATE TRIGGER order_line_items_update
INSTEAD OF UPDATE ON "public"."order_line_items"
FOR EACH ROW EXECUTE FUNCTION order_line_items_update_trigger();

CREATE TRIGGER order_line_items_delete
INSTEAD OF DELETE ON "public"."order_line_items"
FOR EACH ROW EXECUTE FUNCTION order_line_items_delete_trigger(); 