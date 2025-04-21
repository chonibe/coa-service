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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paypal_email TEXT,
  payout_method VARCHAR(50) DEFAULT 'paypal',
  password_hash TEXT
);

-- Create index on vendor_name for faster lookups
CREATE INDEX IF NOT EXISTS vendors_vendor_name_idx ON vendors (vendor_name);

-- Update vendors with a default password hash
-- This is a hash for the password 'password' - replace with your own if needed
UPDATE vendors SET password_hash = '$2a$10$JwZPb5xQlRdT7CQxTu4Z8.Ec.xzQQMJ2hJAuQwMKfZcBGBNW4gBse' WHERE password_hash IS NULL;

-- Insert a test vendor if it doesn't already exist
INSERT INTO vendors (vendor_name)
SELECT 'test_vendor'
WHERE NOT EXISTS (
  SELECT 1
  FROM vendors
  WHERE vendor_name = 'test_vendor'
);

-- Make sure to update the password hash for this vendor
UPDATE vendors 
SET password_hash = '$2a$10$JwZPb5xQlRdT7CQxTu4Z8.Ec.xzQQMJ2hJAuQwMKfZcBGBNW4gBse' 
WHERE vendor_name = 'test_vendor';
