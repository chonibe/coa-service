-- Function to calculate pending payouts for vendors
CREATE OR REPLACE FUNCTION get_pending_vendor_payouts()
RETURNS TABLE (
  vendor_name TEXT,
  amount DECIMAL,
  product_count INTEGER,
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
    SELECT DISTINCT line_item_id
    FROM vendor_payout_items
    WHERE payout_id IS NOT NULL
  ),
  pending_items AS (
    -- Get all line items that haven't been paid yet
    SELECT 
      oli.vendor_name,
      oli.line_item_id,
      oli.product_id,
      oli.price,
      COALESCE(pvp.payout_amount, 10) as payout_amount,
      COALESCE(pvp.is_percentage, true) as is_percentage
    FROM order_line_items oli
    LEFT JOIN product_vendor_payouts pvp ON oli.product_id = pvp.product_id AND oli.vendor_name = pvp.vendor_name
    WHERE 
      oli.status = 'active' 
      AND oli.vendor_name IS NOT NULL
      AND oli.line_item_id NOT IN (SELECT line_item_id FROM paid_line_items)
  ),
  vendor_totals AS (
    -- Calculate the payout amount for each vendor
    SELECT 
      pi.vendor_name,
      COUNT(DISTINCT pi.line_item_id) as product_count,
      SUM(
        CASE 
          WHEN pi.is_percentage THEN (COALESCE(pi.price, 0) * pi.payout_amount / 100)
          ELSE pi.payout_amount
        END
      ) as amount
    FROM pending_items pi
    GROUP BY pi.vendor_name
  )
  SELECT 
    vt.vendor_name,
    vt.amount,
    vt.product_count,
    v.paypal_email,
    v.tax_id,
    v.tax_country,
    v.is_company,
    (
      SELECT MAX(payout_date) 
      FROM vendor_payouts 
      WHERE vendor_name = vt.vendor_name AND status = 'completed'
    ) as last_payout_date
  FROM vendor_totals vt
  LEFT JOIN vendors v ON vt.vendor_name = v.vendor_name
  WHERE vt.amount > 0
  ORDER BY vt.amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get line items for a specific vendor that haven't been paid yet
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
  is_percentage BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH paid_line_items AS (
    -- Get all line items that have already been paid
    SELECT DISTINCT line_item_id
    FROM vendor_payout_items
    WHERE payout_id IS NOT NULL
  )
  SELECT 
    oli.line_item_id,
    oli.order_id,
    oli.order_name,
    oli.product_id,
    p.title as product_title,
    COALESCE(oli.price, 0) as price,
    oli.created_at,
    COALESCE(pvp.payout_amount, 10) as payout_amount,
    COALESCE(pvp.is_percentage, true) as is_percentage
  FROM order_line_items oli
  LEFT JOIN products p ON oli.product_id = p.id
  LEFT JOIN product_vendor_payouts pvp ON oli.product_id = pvp.product_id AND oli.vendor_name = pvp.vendor_name
  WHERE 
    oli.status = 'active' 
    AND oli.vendor_name = p_vendor_name
    AND oli.line_item_id NOT IN (SELECT line_item_id FROM paid_line_items)
  ORDER BY oli.created_at DESC;
END;
$$ LANGUAGE plpgsql;
