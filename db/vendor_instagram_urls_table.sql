-- Create vendor_instagram_urls table if it doesn't exist
CREATE TABLE IF NOT EXISTS vendor_instagram_urls (
 vendor VARCHAR(255) NOT NULL PRIMARY KEY,
 instagram_url TEXT,
 created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_instagram_urls_vendor ON vendor_instagram_urls(vendor);
