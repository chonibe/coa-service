-- Create a function to execute SQL queries
-- This is needed because we can't execute arbitrary SQL directly from the client
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create vendors table if it doesn't exist
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  vendor_name TEXT NOT NULL UNIQUE,
  instagram_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on vendor_name for faster lookups
CREATE INDEX IF NOT EXISTS vendors_vendor_name_idx ON vendors (vendor_name);

-- Add payout information to vendors table
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS paypal_email TEXT,
ADD COLUMN IF NOT EXISTS payout_method VARCHAR(50) DEFAULT 'paypal';

-- Add payout information to order_line_items table
ALTER TABLE order_line_items
ADD COLUMN IF NOT EXISTS payout_amount NUMERIC,
ADD COLUMN IF NOT EXISTS payout_type VARCHAR(50) DEFAULT 'percentage';

-- Add password_hash column to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Update vendors with a default password hash
-- This is a hash for the password 'password' - replace with your own if needed
UPDATE vendors SET password_hash = '$2a$10$JwZPb5xQlRdT7CQxTu4Z8.Ec.xzQQMJ2hJAuQwMKfZcBGBNW4gBse';
INSERT INTO vendors (vendor_name) 
VALUES ('test_vendor');

-- Make sure to update the password hash for this vendor
UPDATE vendors 
SET password_hash = '$2a$10$JwZPb5xQlRdT7CQxTu4Z8.Ec.xzQQMJ2hJAuQwMKfZcBGBNW4gBse' 
WHERE vendor_name = 'test_vendor';
