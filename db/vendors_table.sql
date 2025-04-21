-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  vendor_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  country TEXT,
  zip TEXT,
  website TEXT,
  product_count INTEGER DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  total_sales DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on vendor name for faster searches
CREATE INDEX IF NOT EXISTS vendors_name_idx ON vendors (name);
