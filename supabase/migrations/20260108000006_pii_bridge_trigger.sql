-- Migration: Real-time PII Bridge Trigger
-- Automatically enriches Shopify orders with PII from Warehouse data upon insertion

-- 1. Create the enrichment function
CREATE OR REPLACE FUNCTION public.fn_auto_enrich_shopify_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Logic: Match NEW warehouse_order.order_id with orders.order_name
  -- and NEW warehouse_order.shopify_order_id with orders.id
  -- If a match is found and orders.customer_email is NULL, enrich it.
  
  UPDATE public.orders
  SET 
    customer_email = LOWER(NEW.ship_email),
    updated_at = NOW()
  WHERE 
    (order_name = NEW.order_id OR id = NEW.shopify_order_id)
    AND customer_email IS NULL
    AND NEW.ship_email IS NOT NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS tr_warehouse_enrichment ON public.warehouse_orders;
CREATE TRIGGER tr_warehouse_enrichment
AFTER INSERT OR UPDATE OF ship_email, shopify_order_id ON public.warehouse_orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_enrich_shopify_order();

COMMENT ON FUNCTION public.fn_auto_enrich_shopify_order IS 'Automatically populates missing customer_email in orders table using PII from incoming warehouse data.';

