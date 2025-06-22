-- Add certificate-related columns to order_line_items
ALTER TABLE order_line_items
ADD COLUMN IF NOT EXISTS certificate_url TEXT,
ADD COLUMN IF NOT EXISTS certificate_token TEXT,
ADD COLUMN IF NOT EXISTS certificate_generated_at TIMESTAMP WITH TIME ZONE;
 
-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_order_line_items_certificate_url ON order_line_items(certificate_url);
CREATE INDEX IF NOT EXISTS idx_order_line_items_certificate_token ON order_line_items(certificate_token); 