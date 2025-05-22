-- Add certificate-related columns to order_line_items_v2
ALTER TABLE order_line_items_v2
ADD COLUMN IF NOT EXISTS certificate_url TEXT,
ADD COLUMN IF NOT EXISTS certificate_token TEXT,
ADD COLUMN IF NOT EXISTS certificate_generated_at TIMESTAMP WITH TIME ZONE;
 
-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_order_line_items_v2_certificate_url ON order_line_items_v2(certificate_url);
CREATE INDEX IF NOT EXISTS idx_order_line_items_v2_certificate_token ON order_line_items_v2(certificate_token); 