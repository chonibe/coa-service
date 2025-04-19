-- Create vendor_instagram_urls table if it doesn't exist
CREATE TABLE IF NOT EXISTS vendor_instagram_urls (
  vendor VARCHAR(255) NOT NULL PRIMARY KEY,
  instagram_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shopify_sync_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS shopify_sync_logs (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  items_processed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_instagram_urls_vendor ON vendor_instagram_urls(vendor);
CREATE INDEX IF NOT EXISTS idx_shopify_sync_logs_sync_type ON shopify_sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_shopify_sync_logs_status ON shopify_sync_logs(status);
