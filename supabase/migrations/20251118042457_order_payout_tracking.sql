-- Create order_payout_summary view to show payout status per order
-- This view aggregates payout information at the order level

DROP VIEW IF EXISTS order_payout_summary;

CREATE VIEW order_payout_summary AS
SELECT 
    oli.order_id::TEXT as order_id,
    oli.order_name,
    oli.vendor_name,
    COUNT(DISTINCT oli.line_item_id) as total_line_items,
    COUNT(DISTINCT CASE WHEN oli.fulfillment_status = 'fulfilled' THEN oli.line_item_id END) as fulfilled_line_items,
    COUNT(DISTINCT CASE WHEN vpi.line_item_id IS NOT NULL THEN oli.line_item_id END) as paid_line_items,
    COUNT(DISTINCT CASE WHEN oli.fulfillment_status = 'fulfilled' AND vpi.line_item_id IS NULL THEN oli.line_item_id END) as pending_payout_items,
    SUM(CASE 
        WHEN oli.fulfillment_status = 'fulfilled' AND vpi.line_item_id IS NULL THEN
            CASE 
                WHEN COALESCE(pvp.is_percentage, true) THEN 
                    COALESCE(oli.price, 0) * COALESCE(pvp.payout_amount, 25) / 100
                ELSE 
                    COALESCE(pvp.payout_amount, 0)
            END
        ELSE 0
    END) as pending_payout_amount,
    SUM(CASE 
        WHEN vpi.line_item_id IS NOT NULL THEN vpi.amount
        ELSE 0
    END) as paid_payout_amount,
    MIN(oli.created_at) as order_created_at,
    MAX(oli.updated_at) as last_updated_at
FROM order_line_items_v2 oli
LEFT JOIN vendor_payout_items vpi ON oli.line_item_id::TEXT = vpi.line_item_id::TEXT AND vpi.payout_id IS NOT NULL
LEFT JOIN product_vendor_payouts pvp ON oli.product_id::TEXT = pvp.product_id::TEXT AND oli.vendor_name = pvp.vendor_name
WHERE oli.vendor_name IS NOT NULL
GROUP BY oli.order_id::TEXT, oli.order_name, oli.vendor_name;

-- Add index on fulfillment_status in order_line_items_v2 for performance
CREATE INDEX IF NOT EXISTS idx_order_line_items_v2_fulfillment_status ON order_line_items_v2(fulfillment_status) WHERE fulfillment_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_line_items_v2_vendor_fulfillment ON order_line_items_v2(vendor_name, fulfillment_status) WHERE vendor_name IS NOT NULL AND fulfillment_status = 'fulfilled';

-- Add comment to view
COMMENT ON VIEW order_payout_summary IS 'Provides order-level summary of payout status, showing fulfilled items, paid items, and pending payout amounts';

