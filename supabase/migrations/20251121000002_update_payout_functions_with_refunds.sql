-- Update payout functions to include refund deduction logic
-- This migration replaces the existing functions with versions that handle refunds

-- Updated function to calculate pending payouts for vendors
-- Now includes automatic deduction for refunded items that were previously paid
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
      AND (oli.refund_status IS NULL OR oli.refund_status = 'none')
  ),
  refund_deductions AS (
    -- Calculate refund deductions for items that were previously paid
    SELECT 
      oli.vendor_name,
      SUM(
        CASE 
          WHEN oli.refund_status = 'full' THEN
            -- Full refund: deduct the full payout amount that was paid
            COALESCE(
              (SELECT vpi.amount 
               FROM vendor_payout_items vpi 
               WHERE vpi.line_item_id = oli.line_item_id 
               AND vpi.payout_id IS NOT NULL 
               LIMIT 1),
              -- If not in payout_items, calculate what would have been paid
              CASE 
                WHEN COALESCE(pvp.is_percentage, true) THEN (COALESCE(oli.price, 0) * COALESCE(pvp.payout_amount, 25) / 100)
                ELSE COALESCE(pvp.payout_amount, 0)
              END
            )
          WHEN oli.refund_status = 'partial' THEN
            -- Partial refund: deduct proportional amount
            COALESCE(oli.refunded_amount, 0) * 
            CASE 
              WHEN COALESCE(pvp.is_percentage, true) THEN (COALESCE(pvp.payout_amount, 25) / 100)
              ELSE (COALESCE(pvp.payout_amount, 0) / COALESCE(oli.price, 1))
            END
          ELSE 0
        END
      ) as deduction_amount
    FROM order_line_items_v2 oli
    LEFT JOIN product_vendor_payouts pvp ON oli.product_id::TEXT = pvp.product_id::TEXT AND oli.vendor_name = pvp.vendor_name
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
      COALESCE(
        SUM(
          CASE 
            WHEN pi.is_percentage THEN (COALESCE(pi.price, 0) * pi.payout_amount / 100)
            ELSE pi.payout_amount
          END
        ),
        0
      ) - COALESCE(rd.deduction_amount, 0) as amount
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
      v.is_company
    FROM vendors v
    LEFT JOIN vendor_totals vt ON v.vendor_name = vt.vendor_name
    LEFT JOIN refund_deductions rd ON v.vendor_name = rd.vendor_name
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
  ORDER BY avt.amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Update function to get vendor pending line items (exclude refunded items)
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

