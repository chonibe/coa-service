-- Fix: Drop function before recreating to avoid return type conflicts
DROP FUNCTION IF EXISTS get_vendor_pending_line_items(TEXT);

-- Recreate with updated return type (includes refund_status)
CREATE FUNCTION get_vendor_pending_line_items(p_vendor_name TEXT)
RETURNS TABLE (
  line_item_id TEXT,
  order_id TEXT,
  order_name TEXT,
  product_id TEXT,
  product_title TEXT,
  price DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE,
  payout_amount DECIMAL,
  is_percentage BOOLEAN,
  fulfillment_status TEXT,
  refund_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH paid_line_items AS (
    SELECT DISTINCT vpi.line_item_id
    FROM vendor_payout_items vpi
    WHERE vpi.payout_id IS NOT NULL
  )
  SELECT 
    oli.line_item_id,
    oli.order_id,
    oli.order_name,
    oli.product_id,
    COALESCE(p.name, p.product_id) as product_title,
    COALESCE(oli.price, 0) as price,
    oli.created_at,
    COALESCE(pvp.payout_amount, 25) as payout_amount,
    COALESCE(pvp.is_percentage, true) as is_percentage,
    oli.fulfillment_status,
    COALESCE(oli.refund_status, 'none') as refund_status
  FROM order_line_items_v2 oli
  LEFT JOIN products p ON oli.product_id::TEXT = COALESCE(p.product_id::TEXT, p.id::TEXT)
  LEFT JOIN product_vendor_payouts pvp ON oli.product_id::TEXT = pvp.product_id::TEXT AND oli.vendor_name = pvp.vendor_name
  WHERE 
    oli.vendor_name = p_vendor_name
    AND oli.fulfillment_status = 'fulfilled'
    AND oli.line_item_id::TEXT NOT IN (SELECT pli.line_item_id::TEXT FROM paid_line_items pli)
    AND (oli.refund_status IS NULL OR oli.refund_status = 'none')
  ORDER BY oli.order_id, oli.created_at DESC;
END;
$$ LANGUAGE plpgsql;

