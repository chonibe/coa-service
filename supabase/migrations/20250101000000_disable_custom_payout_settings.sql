-- Disable custom payout settings and use only 25% of item price
-- Update the get_pending_vendor_payouts function to ignore custom payout settings

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
    -- DISABLED: Custom payout settings - always use 25% of item price
    SELECT
      oli.vendor_name,
      oli.line_item_id,
      oli.product_id,
      oli.price,
      oli.order_id,
      25 as payout_amount, -- Always 25%
      true as is_percentage -- Always percentage
    FROM order_line_items_v2 oli
    WHERE
      oli.vendor_name IS NOT NULL
      AND oli.fulfillment_status = 'fulfilled'
      AND oli.line_item_id::TEXT NOT IN (SELECT pli.line_item_id::TEXT FROM paid_line_items pli)
      AND (oli.refund_status IS NULL OR oli.refund_status = 'none')
  ),
  refund_deductions AS (
    -- Calculate refund deductions for items that were previously paid
    SELECT
      oli.vendor_name,
      SUM(
        CASE
          WHEN oli.refund_status = 'full' THEN
            -- Full refund: deduct the full payout amount that was previously paid
            -- DISABLED: Custom payout settings - always use 25% of item price
            (COALESCE(oli.price, 0) * 25 / 100)
          WHEN oli.refund_status = 'partial' THEN
            -- Partial refund: deduct proportional amount
            -- DISABLED: Custom payout settings - always use 25% of refunded amount
            COALESCE(oli.refunded_amount, 0) * (25 / 100)
          ELSE 0
        END
      ) as deduction_amount
    FROM order_line_items_v2 oli
    LEFT JOIN vendor_payout_items vpi ON oli.line_item_id::TEXT = vpi.line_item_id::TEXT AND vpi.payout_id IS NOT NULL
    WHERE
      oli.vendor_name IS NOT NULL
      AND oli.fulfillment_status = 'fulfilled'
      AND oli.refund_status IN ('partial', 'full')
      AND vpi.payout_id IS NOT NULL -- Only deduct for items that were actually paid
    GROUP BY oli.vendor_name
  ),
  vendor_totals AS (
    -- Calculate the payout amount for each vendor (positive items minus refund deductions)
    SELECT
      pi.vendor_name,
      COUNT(DISTINCT pi.line_item_id)::INTEGER as product_count,
      -- DISABLED: Custom payout settings - always calculate as 25% of item price
      COALESCE(SUM(COALESCE(pi.price, 0) * 25 / 100), 0) - COALESCE(rd.deduction_amount, 0) as amount
    FROM pending_items pi
    LEFT JOIN refund_deductions rd ON pi.vendor_name = rd.vendor_name
    GROUP BY pi.vendor_name, rd.deduction_amount
  ),
  all_vendors_with_totals AS (
    -- Get all vendors and their totals (including $0 and negative balances)
    SELECT
      v.vendor_name,
      COALESCE(vt.amount, 0) - COALESCE(rd.deduction_amount, 0) as amount,
      COALESCE(vt.product_count, 0)::INTEGER as product_count,
      v.paypal_email,
      v.tax_id,
      v.tax_country,
      v.is_company,
      lp.last_payout_date
    FROM vendors v
    LEFT JOIN vendor_totals vt ON v.vendor_name = vt.vendor_name
    LEFT JOIN refund_deductions rd ON v.vendor_name = rd.vendor_name
    LEFT JOIN (
      SELECT
        vendor_name,
        MAX(payout_date) as last_payout_date
      FROM vendor_payouts
      WHERE status = 'completed'
      GROUP BY vendor_name
    ) lp ON v.vendor_name = lp.vendor_name
    -- DISABLED: Filter out excluded vendors (Street Collector)
    WHERE v.vendor_name NOT IN ('Street Collector', 'street collector', 'street-collector')
  )
  SELECT
    av.vendor_name,
    av.amount,
    av.product_count,
    av.paypal_email,
    av.tax_id,
    av.tax_country,
    av.is_company,
    av.last_payout_date
  FROM all_vendors_with_totals av
  ORDER BY av.amount DESC;
END;
$$ LANGUAGE plpgsql;







