-- Migration: Add owner columns to order_line_items_v2
-- These columns bridge the gap between Warehouse PII and Collector Profiles

ALTER TABLE order_line_items_v2 
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS owner_email TEXT,
ADD COLUMN IF NOT EXISTS owner_id UUID;

-- Create indexes for fast lookups by email and ID
CREATE INDEX IF NOT EXISTS idx_order_line_items_v2_owner_email ON order_line_items_v2(owner_email);
CREATE INDEX IF NOT EXISTS idx_order_line_items_v2_owner_id ON order_line_items_v2(owner_id);

-- Add comments for clarity
COMMENT ON COLUMN order_line_items_v2.owner_name IS 'Full name of the current edition owner, initially from warehouse shipping data.';
COMMENT ON COLUMN order_line_items_v2.owner_email IS 'Email of the current edition owner, used to link guest orders to registered collector profiles.';
COMMENT ON COLUMN order_line_items_v2.owner_id IS 'UUID of the registered collector profile if the owner has an account.';


