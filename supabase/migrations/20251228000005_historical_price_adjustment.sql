-- Add metadata column to order_line_items_v2 to store historical audit trails
ALTER TABLE "public"."order_line_items_v2" 
ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb;

-- Update existing items before Oct 2025 with the correction note and original price
-- We target items before October 2025 (Sept 2025 and earlier)
UPDATE "public"."order_line_items_v2"
SET 
    metadata = jsonb_build_object(
        'original_price', price,
        'adjustment_note', 'Historical currency correction: Price set to $40.00 to ensure $10.00 payout (25%)',
        'adjusted_at', NOW()
    ),
    price = 40.00
WHERE created_at < '2025-10-01'
AND fulfillment_status = 'fulfilled'
AND LOWER(vendor_name) NOT IN ('street collector', 'street-collector', 'streetcollector');

