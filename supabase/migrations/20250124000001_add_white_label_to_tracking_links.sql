-- Migration to add white-label customization fields to shared_order_tracking_links
-- Allows customers to customize logo and colors for their tracking pages

-- Add logo_url and primary_color columns
ALTER TABLE shared_order_tracking_links 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#8217ff'; -- Default purple color

-- Add comment for documentation
COMMENT ON COLUMN shared_order_tracking_links.logo_url IS 'URL to customer company logo for white-label branding';
COMMENT ON COLUMN shared_order_tracking_links.primary_color IS 'Primary brand color in hex format (e.g., #8217ff)';
