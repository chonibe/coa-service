-- Migration: Add analytics tracking and manual authentication code support
-- Enables tracking of artwork page interactions and fallback authentication for devices without NFC

-- Create artwork_page_analytics table
CREATE TABLE IF NOT EXISTS artwork_page_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    line_item_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'video_play', 'audio_play', 'time_spent')),
    event_data JSONB, -- Additional event metadata (e.g., video duration, time spent in seconds)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_artwork_page_analytics_product_id 
ON artwork_page_analytics(product_id);

CREATE INDEX IF NOT EXISTS idx_artwork_page_analytics_line_item_id 
ON artwork_page_analytics(line_item_id);

CREATE INDEX IF NOT EXISTS idx_artwork_page_analytics_event_type 
ON artwork_page_analytics(event_type);

CREATE INDEX IF NOT EXISTS idx_artwork_page_analytics_created_at 
ON artwork_page_analytics(created_at);

-- Add auth_code column to order_line_items_v2 for manual authentication fallback
ALTER TABLE order_line_items_v2
ADD COLUMN IF NOT EXISTS auth_code TEXT;

-- Create unique index on auth_code to ensure uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_line_items_v2_auth_code_unique 
ON order_line_items_v2(auth_code) 
WHERE auth_code IS NOT NULL;

-- Create index for faster lookups by auth_code
CREATE INDEX IF NOT EXISTS idx_order_line_items_v2_auth_code 
ON order_line_items_v2(auth_code) 
WHERE auth_code IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE artwork_page_analytics IS 'Tracks collector interactions with artwork pages (views, video/audio plays, time spent)';
COMMENT ON COLUMN artwork_page_analytics.event_type IS 'Type of event: page_view, video_play, audio_play, or time_spent';
COMMENT ON COLUMN artwork_page_analytics.event_data IS 'Additional event metadata stored as JSON';
COMMENT ON COLUMN order_line_items_v2.auth_code IS 'Unique authentication code for manual authentication fallback (format: XXXX-XXXX-XXXX)';
