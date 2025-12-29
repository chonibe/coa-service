-- Rebuild Ledger Earnings with Historical Fix ($40 revenue / $10 payout)
-- This ensures the single source of truth (collector_ledger_entries) matches our new policy
BEGIN;

-- 1. Temporarily disable the immutability trigger
DROP TRIGGER IF EXISTS trg_protect_ledger_immutability ON collector_ledger_entries;

-- 2. Clear any existing payout_earned entries (just in case)
DELETE FROM collector_ledger_entries 
WHERE transaction_type = 'payout_earned';

-- 3. REBUILD earnings from fulfilled order line items
-- We apply the $40 revenue / $10 payout rule for all items before October 2025
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
        WHEN oli.created_at < '2025-10-01' THEN 'Payout earnings (Historical Adjustment: $40 Revenue -> $10 Payout)'
        ELSE 'Payout earnings (Standard 25% share)'
    END as description,
    jsonb_build_object(
        'original_price', COALESCE(oli.metadata->>'original_price', oli.price::text),
        'historical_adjustment', oli.created_at < '2025-10-01',
        'vendor_name', oli.vendor_name,
        'rebuilt_at', NOW()
    ) as metadata,
    EXTRACT(YEAR FROM oli.created_at) as tax_year,
    oli.created_at,
    'system_rebuild_v2'
FROM order_line_items_v2 oli
LEFT JOIN vendors v ON oli.vendor_name = v.vendor_name
WHERE (oli.fulfillment_status = 'fulfilled' OR oli.created_at < '2025-10-01')
AND LOWER(oli.vendor_name) NOT IN ('street collector', 'street-collector', 'streetcollector');

-- 4. Re-install the immutability trigger
CREATE TRIGGER trg_protect_ledger_immutability
BEFORE UPDATE OR DELETE ON collector_ledger_entries
FOR EACH ROW EXECUTE FUNCTION protect_ledger_immutability();

COMMIT;

