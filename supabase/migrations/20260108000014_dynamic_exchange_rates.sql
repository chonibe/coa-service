-- Update Payout Functions to use the exchange_rates table
-- This replaces hardcoded rates with daily-updated market rates.

-- 1. Update get_pending_vendor_payouts
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
DECLARE
  v_gbp_rate DECIMAL := 1.27; -- Fallback
  v_ils_rate DECIMAL := 0.27; -- Fallback
BEGIN
  -- Fetch current rates from the table
  SELECT rate INTO v_gbp_rate FROM exchange_rates WHERE from_currency = 'GBP' AND to_currency = 'USD' LIMIT 1;
  SELECT rate INTO v_ils_rate FROM exchange_rates WHERE from_currency = 'ILS' AND to_currency = 'USD' LIMIT 1;

  RETURN QUERY
  WITH paid_line_items AS (
    SELECT DISTINCT vpi.line_item_id
    FROM vendor_payout_items vpi
    WHERE vpi.payout_id IS NOT NULL
  ),
  eligible_items AS (
    SELECT 
      oli.vendor_name,
      oli.line_item_id,
      oli.fulfillment_status,
      oli.created_at,
      oli.price,
      oli.product_id,
      COALESCE(pvp.payout_amount, 25) as p_amount,
      COALESCE(pvp.is_percentage, true) as p_is_percentage,
      COALESCE(o.currency_code, 'USD') as currency
    FROM order_line_items_v2 oli
    LEFT JOIN orders o ON oli.order_id = o.id
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
              WHEN ei.created_at < '2025-10-01' THEN 10.00 -- Historical fix
              ELSE 
                (CASE 
                  WHEN UPPER(ei.currency) = 'GBP' THEN (COALESCE(ei.price, 0) * v_gbp_rate)
                  WHEN UPPER(ei.currency) IN ('NIS', 'ILS') THEN (COALESCE(ei.price, 0) * v_ils_rate)
                  ELSE COALESCE(ei.price, 0)
                END) * 
                (CASE WHEN ei.p_is_percentage THEN ei.p_amount / 100.0 ELSE 1 END) +
                (CASE WHEN NOT ei.p_is_percentage THEN ei.p_amount ELSE 0 END)
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
  WHERE v.vendor_name IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Update get_vendor_pending_line_items
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
  fulfillment_status TEXT,
  currency TEXT
) AS $$
DECLARE
  v_gbp_rate DECIMAL := 1.27; -- Fallback
  v_ils_rate DECIMAL := 0.27; -- Fallback
BEGIN
  -- Fetch current rates from the table
  SELECT rate INTO v_gbp_rate FROM exchange_rates WHERE from_currency = 'GBP' AND to_currency = 'USD' LIMIT 1;
  SELECT rate INTO v_ils_rate FROM exchange_rates WHERE from_currency = 'ILS' AND to_currency = 'USD' LIMIT 1;

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
    CASE 
      WHEN oli.created_at < '2025-10-01' THEN 40.00
      WHEN UPPER(COALESCE(o.currency_code, 'USD')) = 'GBP' THEN (COALESCE(oli.price, 0) * v_gbp_rate)
      WHEN UPPER(COALESCE(o.currency_code, 'USD')) IN ('NIS', 'ILS') THEN (COALESCE(oli.price, 0) * v_ils_rate)
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
    oli.fulfillment_status,
    COALESCE(o.currency_code, 'USD') as currency
  FROM order_line_items_v2 oli
  LEFT JOIN orders o ON oli.order_id = o.id
  LEFT JOIN products p ON oli.product_id::TEXT = COALESCE(p.product_id::TEXT, p.id::TEXT)
  LEFT JOIN product_vendor_payouts pvp ON oli.product_id::TEXT = pvp.product_id::TEXT AND oli.vendor_name = pvp.vendor_name
  WHERE 
    oli.vendor_name = p_vendor_name
    AND (oli.fulfillment_status = 'fulfilled' OR oli.fulfillment_status = 'unfulfilled' OR oli.fulfillment_status = 'partially_fulfilled')
    AND (oli.restocked IS FALSE OR oli.restocked IS NULL)
    AND (oli.status IS NULL OR oli.status != 'cancelled')
    AND oli.line_item_id::TEXT NOT IN (SELECT pli.line_item_id::TEXT FROM paid_line_items pli)
  ORDER BY oli.order_id, oli.created_at DESC;
END;
$$ LANGUAGE plpgsql;


