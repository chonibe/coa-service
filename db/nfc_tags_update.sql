-- Update nfc_tags table to add customer-facing fields
ALTER TABLE nfc_tags 
ADD COLUMN IF NOT EXISTS customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE;

-- Update order_line_items table to track NFC claims
ALTER TABLE order_line_items 
ADD COLUMN IF NOT EXISTS nfc_tag_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS nfc_claimed_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_nfc_tags_customer_id ON nfc_tags(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_line_items_nfc_tag_id ON order_line_items(nfc_tag_id);
