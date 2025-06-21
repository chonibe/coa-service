-- Create artwork_stories table
CREATE TABLE IF NOT EXISTS artwork_stories (
    id SERIAL PRIMARY KEY,
    product_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    media_urls TEXT[],
    requires_nfc BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_artwork_stories_product_id ON artwork_stories(product_id);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_artwork_story_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamp
CREATE TRIGGER update_artwork_story_timestamp
    BEFORE UPDATE ON artwork_stories
    FOR EACH ROW
    EXECUTE FUNCTION update_artwork_story_timestamp();