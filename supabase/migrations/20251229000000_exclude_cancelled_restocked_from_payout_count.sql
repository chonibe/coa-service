-- Ensure cancelled and restocked items are excluded from pending payout count
-- This migration updates the payout functions to explicitly exclude cancelled and restocked items

-- Update get_pending_vendor_payouts function
DROP FUNCTION IF EXISTS get_pending_vendor_payouts();
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
    -- Get all line items that have already been paid
    SELECT DISTINCT vpi.line_item_id
    FROM vendor_payout_items vpi
    WHERE vpi.payout_id IS NOT NULL
  ),
  eligible_items AS (
    -- Get all potential items EXCLUDING cancelled and restocked items
    -- CRITICAL: cancelled items (status = 'cancelled') and restocked items (restocked = true) are excluded
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
      -- EXCLUDE cancelled items
      AND (oli.status IS NULL OR oli.status != 'cancelled')
      -- EXCLUDE restocked items
      AND (oli.restocked IS FALSE OR oli.restocked IS NULL)
      -- EXCLUDE already paid items
      AND oli.line_item_id::TEXT NOT IN (SELECT pli.line_item_id::TEXT FROM paid_line_items pli)
  ),
  vendor_totals AS (
    -- Calculate counts and amounts, only including eligible items (already filtered above)
    SELECT 
      ei.vendor_name,
      -- product_count: only count fulfilled items that are NOT cancelled or restocked
      COUNT(DISTINCT ei.line_item_id) FILTER (WHERE ei.fulfillment_status = 'fulfilled')::INTEGER as product_count,
      -- pending_fulfillment_count: count unfulfilled items that are NOT cancelled or restocked
      COUNT(DISTINCT ei.line_item_id) FILTER (WHERE ei.fulfillment_status != 'fulfilled')::INTEGER as pending_fulfillment_count,
      -- amount: only calculate for fulfilled items that are NOT cancelled or restocked
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

-- Update get_vendor_pending_line_items function
DROP FUNCTION IF EXISTS get_vendor_pending_line_items(TEXT);
CREATE OR REPLACE FUNCTION get_vendor_pending_line_items(p_vendor_name TEXT)
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
  fulfillment_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH paid_line_items AS (
    -- Get all line items that have already been paid
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
    CASE 
      WHEN oli.created_at < '2025-10-01' THEN 40.00
      ELSE COALESCE(oli.price, 0)
    END as price,
    oli.created_at,
    CASE 
      WHEN oli.created_at < '2025-10-01' THEN 10.00
      ELSE COALESCE(pvp.payout_amount, 25)
    END as payout_amount,
    CASE 
      WHEN oli.created_at < '2025-10-01' THEN false
      ELSE COALESCE(pvp.is_percentage, true)
    END as is_percentage,
    oli.fulfillment_status
  FROM order_line_items_v2 oli
  LEFT JOIN products p ON oli.product_id::TEXT = COALESCE(p.product_id::TEXT, p.id::TEXT)
  LEFT JOIN product_vendor_payouts pvp ON oli.product_id::TEXT = pvp.product_id::TEXT AND oli.vendor_name = pvp.vendor_name
  WHERE 
    oli.vendor_name = p_vendor_name
    AND (oli.fulfillment_status = 'fulfilled' OR oli.fulfillment_status = 'unfulfilled' OR oli.fulfillment_status = 'partially_fulfilled')
    -- EXCLUDE restocked items
    AND (oli.restocked IS FALSE OR oli.restocked IS NULL)
    -- EXCLUDE cancelled items
    AND (oli.status IS NULL OR oli.status != 'cancelled')
    -- EXCLUDE already paid items
    AND oli.line_item_id::TEXT NOT IN (SELECT pli.line_item_id::TEXT FROM paid_line_items pli)
  ORDER BY oli.order_id, oli.created_at DESC;
END;
$$ LANGUAGE plpgsql;

