-- Create product_vendor_payouts table to track payout settings for products
CREATE TABLE IF NOT EXISTS product_vendor_payouts (
    id SERIAL PRIMARY KEY,
    product_id TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    payout_amount DECIMAL(10, 2),
    is_percentage BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (product_id, vendor_name)
);

-- Create index on product_id for faster lookups
CREATE INDEX IF NOT EXISTS product_vendor_payouts_product_id_idx ON product_vendor_payouts (product_id);

-- Create index on vendor_name for faster lookups
CREATE INDEX IF NOT EXISTS product_vendor_payouts_vendor_name_idx ON product_vendor_payouts (vendor_name);
