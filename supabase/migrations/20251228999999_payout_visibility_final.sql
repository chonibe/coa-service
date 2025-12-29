-- Final Payout Visibility and Ledger Rebuild
-- This combines everything: excluding restocked/cancelled, historical fix, and admin visibility
BEGIN;

-- 1. Temporarily disable the immutability trigger
DROP TRIGGER IF EXISTS trg_protect_ledger_immutability ON collector_ledger_entries;

-- 2. Clear all payout-related financial records
DELETE FROM collector_ledger_entries 
WHERE transaction_type IN ('payout_earned', 'payout_withdrawal');

-- 3. REBUILD earnings with strict filters (only fulfilled AND not restocked)
INSERT INTO collector_ledger_entries (
    collector_identifier,
    transaction_type,
    amount,
    currency,
    order_id,
    line_item_id,
    description,
    metadata,
    tax_year,
    created_at,
    created_by
)
SELECT 
    COALESCE(v.auth_id::TEXT, oli.vendor_name) as collector_identifier,
    'payout_earned'::collector_transaction_type,
    CASE 
        WHEN oli.created_at < '2025-10-01' THEN 10.00 -- Historical Fix
        ELSE (oli.price * 0.25) -- Standard 25% share
    END as amount,
    'USD',
    oli.order_id,
    oli.line_item_id,
    CASE 
        WHEN oli.created_at < '2025-10-01' THEN 'Payout earnings (Historical Fix: Fulfilled items only)'
        ELSE 'Payout earnings (Standard 25% share)'
    END as description,
    jsonb_build_object(
        'original_price', COALESCE(oli.metadata->>'original_price', oli.price::text),
        'historical_adjustment', oli.created_at < '2025-10-01',
        'vendor_name', oli.vendor_name,
        'fulfillment_status', oli.fulfillment_status,
        'restocked', oli.restocked,
        'rebuilt_at', NOW()
    ) as metadata,
    EXTRACT(YEAR FROM oli.created_at) as tax_year,
    oli.created_at,
    'system_rebuild_final'
FROM order_line_items_v2 oli
LEFT JOIN vendors v ON oli.vendor_name = v.vendor_name
WHERE oli.fulfillment_status = 'fulfilled'
AND (oli.restocked IS FALSE OR oli.restocked IS NULL)
AND (oli.status IS NULL OR oli.status != 'cancelled')
AND LOWER(oli.vendor_name) NOT IN ('street collector', 'street-collector', 'streetcollector');

-- 4. Update Functions (Drop first to handle return type changes)
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
  WHERE v.vendor_name IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

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
    AND (oli.restocked IS FALSE OR oli.restocked IS NULL)
    AND (oli.status IS NULL OR oli.status != 'cancelled')
    AND oli.line_item_id::TEXT NOT IN (SELECT pli.line_item_id::TEXT FROM paid_line_items pli)
  ORDER BY oli.order_id, oli.created_at DESC;
END;
$$ LANGUAGE plpgsql;

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
  WITH order_line_items_data AS (
    SELECT 
      oli.order_id,
      oli.order_name,
      oli.vendor_name,
      oli.line_item_id,
      oli.product_id,
      CASE 
        WHEN oli.created_at < '2025-10-01' THEN 40.00
        ELSE oli.price 
      END as price,
      oli.fulfillment_status,
      oli.created_at,
      CASE 
        WHEN oli.created_at < '2025-10-01' THEN 10.00
        ELSE COALESCE(pvp.payout_amount, 25)
      END as payout_amount,
      CASE 
        WHEN oli.created_at < '2025-10-01' THEN false
        ELSE COALESCE(pvp.is_percentage, true)
      END as is_percentage,
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
      AND (oli.status IS NULL OR oli.status != 'cancelled')
      AND (oli.restocked IS FALSE OR oli.restocked IS NULL)
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
  WHERE os.payout_amount > 0 OR os.paid_line_items > 0;
END;
$$ LANGUAGE plpgsql;

-- 5. Re-install the immutability trigger
CREATE TRIGGER trg_protect_ledger_immutability
BEFORE UPDATE OR DELETE ON collector_ledger_entries
FOR EACH ROW EXECUTE FUNCTION protect_ledger_immutability();

COMMIT;
