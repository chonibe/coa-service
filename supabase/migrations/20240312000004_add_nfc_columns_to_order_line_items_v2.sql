-- Add NFC-related columns to order_line_items table
ALTER TABLE order_line_items
ADD COLUMN IF NOT EXISTS nfc_tag_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS nfc_claimed_at TIMESTAMP WITH TIME ZONE;
 
-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_order_line_items_nfc_tag_id ON order_line_items(nfc_tag_id); 