-- Create vendors table if it doesn't exist
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  vendor_name TEXT NOT NULL UNIQUE,
  instagram_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paypal_email TEXT,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create index on vendor_name for faster lookups
CREATE INDEX IF NOT EXISTS vendors_vendor_name_idx ON vendors (vendor_name);
