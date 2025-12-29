-- Function to calculate pending payouts for vendors
-- Updated: Strictly excludes restocked/cancelled items
-- Updated: Includes pending_fulfillment_count for admin visibility
CREATE OR REPLACE FUNCTION get_pending_vendor_payouts()
RETURNS TABLE (
  vendor_name TEXT,
  amount DECIMAL,
  product_count INTEGER,
  pending_fulfillment_count INTEGER,
  paypal_email TEXT,
  tax_id TEXT,
  tax_country TEXT,
  is_company BOOLEAN,
  last_payout_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH paid_line_items AS (
    SELECT DISTINCT vpi.line_item_id
    FROM vendor_payout_items vpi
    WHERE vpi.payout_id IS NOT NULL
  ),
  eligible_items AS (
    -- Get all potential items (excluding cancelled/restocked)
    SELECT 
      oli.vendor_name,
      oli.line_item_id,
      oli.fulfillment_status,
      oli.created_at,
      oli.price,
      oli.product_id,
      COALESCE(pvp.payout_amount, 25) as p_amount,
      COALESCE(pvp.is_percentage, true) as p_is_percentage
    FROM order_line_items_v2 oli
    LEFT JOIN product_vendor_payouts pvp ON oli.product_id::TEXT = pvp.product_id::TEXT AND oli.vendor_name = pvp.vendor_name
    WHERE 
      oli.vendor_name IS NOT NULL
      AND (oli.status IS NULL OR oli.status != 'cancelled')
      AND (oli.restocked IS FALSE OR oli.restocked IS NULL)
      AND oli.line_item_id::TEXT NOT IN (SELECT pli.line_item_id::TEXT FROM paid_line_items pli)
  ),
  vendor_totals AS (
    SELECT 
      ei.vendor_name,
      COUNT(DISTINCT ei.line_item_id) FILTER (WHERE ei.fulfillment_status = 'fulfilled')::INTEGER as product_count,
      COUNT(DISTINCT ei.line_item_id) FILTER (WHERE ei.fulfillment_status != 'fulfilled')::INTEGER as pending_fulfillment_count,
      SUM(
        CASE 
          WHEN ei.fulfillment_status = 'fulfilled' THEN
            CASE
              WHEN ei.created_at < '2025-10-01' THEN 10.00
              WHEN ei.p_is_percentage THEN (COALESCE(ei.price, 0) * ei.p_amount / 100)
              ELSE ei.p_amount
            END
          ELSE 0
        END
      ) as amount
    FROM eligible_items ei
    GROUP BY ei.vendor_name
  )
  SELECT 
    v.vendor_name,
    COALESCE(vt.amount, 0) as amount,
    COALESCE(vt.product_count, 0)::INTEGER as product_count,
    COALESCE(vt.pending_fulfillment_count, 0)::INTEGER as pending_fulfillment_count,
    v.paypal_email,
    v.tax_id,
    v.tax_country,
    v.is_company,
    (
      SELECT MAX(vp.payout_date) 
      FROM vendor_payouts vp
      WHERE vp.vendor_name = v.vendor_name AND vp.status = 'completed'
    ) as last_payout_date
  FROM vendors v
  LEFT JOIN vendor_totals vt ON v.vendor_name = vt.vendor_name
  WHERE v.vendor_name IS NOT NULL
  ORDER BY amount DESC;
END;
$$ LANGUAGE plpgsql;
