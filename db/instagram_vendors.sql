-- Create instagram_vendors table
CREATE TABLE IF NOT EXISTS instagram_vendors (
    vendor_id VARCHAR(255) PRIMARY KEY,
    instagram_username VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
