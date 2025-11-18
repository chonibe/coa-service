-- Remove status = 'active' filter from payout functions
-- This allows closed/completed orders from the past to be included in payouts
-- We only filter by fulfillment_status = 'fulfilled', not order status

-- Update get_pending_vendor_payouts function
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
    -- Removed status = 'active' filter to include closed/completed orders
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
    SELECT 
      COALESCE(v.vendor_name, vt.vendor_name) as vendor_name,
      COALESCE(vt.amount, 0) as amount,
      COALESCE(vt.product_count, 0) as product_count,
      v.paypal_email,
      v.tax_id,
      v.tax_country,
      v.is_company
    FROM vendors v
    FULL OUTER JOIN vendor_totals vt ON v.vendor_name = vt.vendor_name
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

-- Update get_vendor_pending_line_items function
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
    COALESCE(oli.price, 0) as price,
    oli.created_at,
    COALESCE(pvp.payout_amount, 25) as payout_amount,
    COALESCE(pvp.is_percentage, true) as is_percentage,
    oli.fulfillment_status
  FROM order_line_items_v2 oli
  LEFT JOIN products p ON oli.product_id::TEXT = COALESCE(p.product_id::TEXT, p.id::TEXT)
  LEFT JOIN product_vendor_payouts pvp ON oli.product_id::TEXT = pvp.product_id::TEXT AND oli.vendor_name = pvp.vendor_name
  WHERE 
    oli.vendor_name = p_vendor_name
    AND oli.fulfillment_status = 'fulfilled'
    AND oli.line_item_id::TEXT NOT IN (SELECT pli.line_item_id::TEXT FROM paid_line_items pli)
  ORDER BY oli.order_id, oli.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Update get_vendor_payout_by_order function
CREATE OR REPLACE FUNCTION get_vendor_payout_by_order(
  p_vendor_name TEXT,
  p_order_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  order_id TEXT,
  order_name TEXT,
  order_date TIMESTAMP WITH TIME ZONE,
  total_line_items INTEGER,
  fulfilled_line_items INTEGER,
  paid_line_items INTEGER,
  pending_line_items INTEGER,
  order_total DECIMAL,
  payout_amount DECIMAL,
  line_items JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH paid_line_items AS (
    SELECT DISTINCT vpi.line_item_id
    FROM vendor_payout_items vpi
    WHERE vpi.payout_id IS NOT NULL
  ),
  order_line_items_data AS (
    SELECT 
      oli.order_id,
      oli.order_name,
      oli.vendor_name,
      oli.line_item_id,
      oli.product_id,
      oli.price,
      oli.fulfillment_status,
      oli.created_at,
      COALESCE(pvp.payout_amount, 25) as payout_amount,
      COALESCE(pvp.is_percentage, true) as is_percentage,
      COALESCE(p.name, p.product_id) as product_title,
      CASE 
        WHEN vpi.line_item_id IS NOT NULL THEN true
        ELSE false
      END as is_paid
    FROM order_line_items_v2 oli
    LEFT JOIN products p ON oli.product_id::TEXT = COALESCE(p.product_id::TEXT, p.id::TEXT)
    LEFT JOIN product_vendor_payouts pvp ON oli.product_id::TEXT = pvp.product_id::TEXT AND oli.vendor_name = pvp.vendor_name
    LEFT JOIN vendor_payout_items vpi ON oli.line_item_id::TEXT = vpi.line_item_id::TEXT AND vpi.payout_id IS NOT NULL
    WHERE 
      oli.vendor_name = p_vendor_name
      AND (p_order_id IS NULL OR oli.order_id = p_order_id)
      AND oli.fulfillment_status = 'fulfilled'
  ),
  order_summary AS (
    SELECT 
      order_id,
      order_name,
      MIN(created_at) as order_date,
      COUNT(*)::INTEGER as total_line_items,
      COUNT(*) FILTER (WHERE fulfillment_status = 'fulfilled')::INTEGER as fulfilled_line_items,
      COUNT(*) FILTER (WHERE is_paid = true)::INTEGER as paid_line_items,
      COUNT(*) FILTER (WHERE is_paid = false)::INTEGER as pending_line_items,
      SUM(price) as order_total,
      SUM(
        CASE 
          WHEN is_paid = false THEN
            CASE 
              WHEN is_percentage THEN (price * payout_amount / 100)
              ELSE payout_amount
            END
          ELSE 0
        END
      ) as payout_amount,
      jsonb_agg(
        jsonb_build_object(
          'line_item_id', line_item_id,
          'product_id', product_id,
          'product_title', product_title,
          'price', price,
          'payout_amount', CASE 
            WHEN is_percentage THEN (price * payout_amount / 100)
            ELSE payout_amount
          END,
          'payout_percentage', CASE WHEN is_percentage THEN payout_amount ELSE NULL END,
          'is_paid', is_paid,
          'fulfillment_status', fulfillment_status
        ) ORDER BY created_at
      ) as line_items
    FROM order_line_items_data
    GROUP BY order_id, order_name
  )
  SELECT 
    os.order_id,
    os.order_name,
    os.order_date,
    os.total_line_items,
    os.fulfilled_line_items,
    os.paid_line_items,
    os.pending_line_items,
    os.order_total,
    os.payout_amount,
    os.line_items
  FROM order_summary os
  WHERE os.payout_amount > 0 OR os.paid_line_items > 0
  ORDER BY os.order_date DESC;
END;
$$ LANGUAGE plpgsql;

