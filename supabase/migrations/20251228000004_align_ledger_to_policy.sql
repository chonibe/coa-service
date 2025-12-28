-- Final Financial Alignment: Rebuild ledger earnings based on strict 25% share + historical store correction
-- This migration purges incorrect payout_earned entries and regenerates them from fulfilled orders.

BEGIN;

-- Temporarily disable the immutability trigger for this cleanup
DROP TRIGGER IF EXISTS trg_protect_ledger_immutability ON collector_ledger_entries;

-- 1. DELETE all existing payout_earned entries from the unified ledger
-- We preserve withdrawals, adjustments, and credits as they are already verified.
DELETE FROM collector_ledger_entries 
WHERE transaction_type = 'payout_earned' 
AND currency = 'USD';

-- 2. REBUILD earnings from fulfilled order line items
-- Logic: 
-- - Exclude 'Street Collector' (house profit)
-- - Policy Rule: If price < 10 (historical error), treat as $40 (payout = $10)
-- - Standard Rule: Otherwise, payout = price * 0.25
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
        WHEN oli.price < 10 THEN 10.00 
        ELSE (oli.price * 0.25) 
    END as amount,
    'USD', -- currency is TEXT with check constraint
    oli.order_id,
    oli.line_item_id,
    CASE 
        WHEN oli.price < 10 THEN 'Payout earnings (Price Correction applied: <$10 -> $40)'
        ELSE 'Payout earnings (Standard 25% share)'
    END as description,
    jsonb_build_object(
        'original_price', oli.price,
        'correction_applied', oli.price < 10,
        'vendor_name', oli.vendor_name,
        'rebuilt_at', NOW()
    ) as metadata,
    EXTRACT(YEAR FROM oli.created_at) as tax_year,
    oli.created_at,
    'system_rebuild'
FROM order_line_items_v2 oli
LEFT JOIN vendors v ON oli.vendor_name = v.vendor_name
WHERE oli.fulfillment_status = 'fulfilled'
AND LOWER(oli.vendor_name) NOT IN ('street collector', 'street-collector', 'streetcollector');

-- 3. Re-install the immutability trigger
CREATE TRIGGER trg_protect_ledger_immutability
BEFORE UPDATE OR DELETE ON collector_ledger_entries
FOR EACH ROW EXECUTE FUNCTION protect_ledger_immutability();

COMMIT;
