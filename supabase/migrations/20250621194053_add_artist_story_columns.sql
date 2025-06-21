-- Add columns for artist bio and artwork story
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

ALTER TABLE order_line_items_v2
ADD COLUMN IF NOT EXISTS artwork_story TEXT,
ADD COLUMN IF NOT EXISTS artwork_media_urls TEXT[];
