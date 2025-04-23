-- Add certificate fields to order_line_items table
ALTER TABLE order_line_items 
ADD COLUMN IF NOT EXISTS certificate_url TEXT,
ADD COLUMN IF NOT EXISTS certificate_token TEXT,
ADD COLUMN IF NOT EXISTS certificate_generated_at TIMESTAMP WITH TIME ZONE;

-- Create certificate access logs table
CREATE TABLE IF NOT EXISTS certificate_access_logs (
  id SERIAL PRIMARY KEY,
  line_item_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (line_item_id, order_id) REFERENCES order_line_items (line_item_id, order_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_certificate_access_logs_line_item_id ON certificate_access_logs(line_item_id);
CREATE INDEX IF NOT EXISTS idx_certificate_access_logs_accessed_at ON certificate_access_logs(accessed_at);
