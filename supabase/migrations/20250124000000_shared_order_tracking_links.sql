-- Migration for Shared Order Tracking Links
-- Allows admins to generate shareable links for customers to track specific warehouse orders

-- Create shared_order_tracking_links table
CREATE TABLE IF NOT EXISTS shared_order_tracking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  order_ids TEXT[] NOT NULL, -- Array of warehouse order IDs from ChinaDivision
  title TEXT, -- Optional title/description for the link
  created_by TEXT NOT NULL, -- Admin email who created the link
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration date
  access_count INTEGER DEFAULT 0, -- Track how many times the link was accessed
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on token for fast lookups
CREATE INDEX IF NOT EXISTS idx_shared_order_tracking_links_token ON shared_order_tracking_links(token);

-- Create index on created_by for admin queries
CREATE INDEX IF NOT EXISTS idx_shared_order_tracking_links_created_by ON shared_order_tracking_links(created_by);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_shared_order_tracking_links_expires_at ON shared_order_tracking_links(expires_at) WHERE expires_at IS NOT NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shared_order_tracking_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_shared_order_tracking_links_updated_at
  BEFORE UPDATE ON shared_order_tracking_links
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_order_tracking_links_updated_at();

-- Function to increment access count
CREATE OR REPLACE FUNCTION increment_tracking_link_access(token_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE shared_order_tracking_links
  SET 
    access_count = access_count + 1,
    last_accessed_at = NOW()
  WHERE token = token_param;
END;
$$ LANGUAGE plpgsql;

