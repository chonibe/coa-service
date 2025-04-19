-- Drop the table if it exists to recreate with the correct schema
DROP TABLE IF EXISTS instagram_vendors;

-- Create the instagram_vendors table with the correct schema
CREATE TABLE instagram_vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  instagram_username TEXT,
  instagram_account_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_id)
);

-- Create index on vendor_id for faster lookups
CREATE INDEX idx_instagram_vendors_vendor_id ON instagram_vendors(vendor_id);

-- Add comment to table
COMMENT ON TABLE instagram_vendors IS 'Stores Instagram connection details for vendors';
