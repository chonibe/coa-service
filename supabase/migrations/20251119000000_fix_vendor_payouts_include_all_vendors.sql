-- Fix get_pending_vendor_payouts to ensure ALL vendors from vendors table are included
-- Change from FULL OUTER JOIN to LEFT JOIN to ensure we start from vendors table

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
    SELECT DISTINCT vpi.line_item_id
    FROM vendor_payout_items vpi
    WHERE vpi.payout_id IS NOT NULL
  ),
  pending_items AS (
    -- Get all fulfilled line items that haven't been paid yet
    SELECT 
      oli.vendor_name,
      oli.line_item_id,
      oli.product_id,
      oli.price,
      oli.order_id,
      COALESCE(pvp.payout_amount, 25) as payout_amount,
      COALESCE(pvp.is_percentage, true) as is_percentage
    FROM order_line_items_v2 oli
    LEFT JOIN product_vendor_payouts pvp ON oli.product_id::TEXT = pvp.product_id::TEXT AND oli.vendor_name = pvp.vendor_name
    WHERE 
      oli.vendor_name IS NOT NULL
      AND oli.fulfillment_status = 'fulfilled'
      AND oli.line_item_id::TEXT NOT IN (SELECT pli.line_item_id::TEXT FROM paid_line_items pli)
  ),
  vendor_totals AS (
    -- Calculate the payout amount for each vendor
    SELECT 
      pi.vendor_name,
      COUNT(DISTINCT pi.line_item_id)::INTEGER as product_count,
      SUM(
        CASE 
          WHEN pi.is_percentage THEN (COALESCE(pi.price, 0) * pi.payout_amount / 100)
          ELSE pi.payout_amount
        END
      ) as amount
    FROM pending_items pi
    GROUP BY pi.vendor_name
  ),
  all_vendors_with_totals AS (
    -- Get all vendors and their totals (including $0)
    -- Start from vendors table to ensure ALL vendors are included
    SELECT 
      v.vendor_name,
      COALESCE(vt.amount, 0) as amount,
      COALESCE(vt.product_count, 0)::INTEGER as product_count,
      v.paypal_email,
      v.tax_id,
      v.tax_country,
      v.is_company
    FROM vendors v
    LEFT JOIN vendor_totals vt ON v.vendor_name = vt.vendor_name
    WHERE v.vendor_name IS NOT NULL
  )
  SELECT 
    avt.vendor_name,
    avt.amount,
    avt.product_count,
    avt.paypal_email,
    avt.tax_id,
    avt.tax_country,
    avt.is_company,
    (
      SELECT MAX(vp.payout_date) 
      FROM vendor_payouts vp
      WHERE vp.vendor_name = avt.vendor_name AND vp.status = 'completed'
    ) as last_payout_date
  FROM all_vendors_with_totals avt
  -- Include all vendors, even if they have $0 pending (they might have paid items or historical data)
  ORDER BY avt.amount DESC;
END;
$$ LANGUAGE plpgsql;

