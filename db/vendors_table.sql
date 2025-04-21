-- Create a minimal vendors table to store custom data
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  vendor_name TEXT UNIQUE NOT NULL,
  instagram_url TEXT,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on vendor name for faster lookups
CREATE INDEX IF NOT EXISTS vendors_name_idx ON vendors (vendor_name);
