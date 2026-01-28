-- Artwork Story Posts Table
-- Collaborative timeline where both artists and collectors contribute
-- Each post includes location (city, country) and timestamp

CREATE TABLE IF NOT EXISTS artwork_story_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Author info
  author_type TEXT NOT NULL CHECK (author_type IN ('artist', 'collector')),
  author_id TEXT NOT NULL, -- vendor_id for artists, collector email for collectors
  author_name TEXT NOT NULL,
  author_avatar_url TEXT,
  
  -- Content
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'photo', 'voice_note')),
  text_content TEXT,
  media_url TEXT,
  media_thumbnail_url TEXT,
  voice_duration_seconds INTEGER, -- For voice notes
  
  -- Location (optional but encouraged)
  city TEXT,
  country TEXT,
  country_code TEXT, -- ISO 3166-1 alpha-2
  
  -- Reply threading (for artist replies)
  parent_post_id UUID REFERENCES artwork_story_posts(id) ON DELETE CASCADE,
  is_artist_reply BOOLEAN DEFAULT false,
  
  -- Visibility
  is_visible BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false, -- Artists can pin their posts
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_story_posts_product_id ON artwork_story_posts(product_id);
CREATE INDEX IF NOT EXISTS idx_story_posts_author ON artwork_story_posts(author_type, author_id);
CREATE INDEX IF NOT EXISTS idx_story_posts_parent ON artwork_story_posts(parent_post_id) WHERE parent_post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_story_posts_created_at ON artwork_story_posts(product_id, created_at DESC);

-- RLS Policies
ALTER TABLE artwork_story_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view visible posts
CREATE POLICY "Anyone can view visible story posts"
  ON artwork_story_posts
  FOR SELECT
  USING (is_visible = true);

-- Artists can create posts for their products
CREATE POLICY "Artists can create story posts"
  ON artwork_story_posts
  FOR INSERT
  WITH CHECK (
    author_type = 'artist' AND
    EXISTS (
      SELECT 1 FROM products p
      JOIN vendors v ON p.vendor_name = v.vendor_name
      WHERE p.id = product_id
      AND v.id::text = author_id
    )
  );

-- Collectors can create posts (will be verified at API level)
CREATE POLICY "Collectors can create story posts"
  ON artwork_story_posts
  FOR INSERT
  WITH CHECK (author_type = 'collector');

-- Authors can update their own posts
CREATE POLICY "Authors can update own posts"
  ON artwork_story_posts
  FOR UPDATE
  USING (
    (author_type = 'artist' AND author_id = auth.uid()::text) OR
    (author_type = 'collector' AND author_id = auth.jwt() ->> 'email')
  );

-- Authors can delete their own posts
CREATE POLICY "Authors can delete own posts"
  ON artwork_story_posts
  FOR DELETE
  USING (
    (author_type = 'artist' AND author_id = auth.uid()::text) OR
    (author_type = 'collector' AND author_id = auth.jwt() ->> 'email')
  );

-- Artists can moderate (hide) any posts on their products
CREATE POLICY "Artists can moderate story posts"
  ON artwork_story_posts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN vendors v ON p.vendor_name = v.vendor_name
      WHERE p.id = product_id
      AND v.id::text = auth.uid()::text
    )
  );

-- Update trigger
CREATE OR REPLACE FUNCTION update_story_post_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER story_posts_updated_at
  BEFORE UPDATE ON artwork_story_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_story_post_timestamp();

-- Comments for documentation
COMMENT ON TABLE artwork_story_posts IS 'Collaborative story timeline for artworks - artists and collectors contribute';
COMMENT ON COLUMN artwork_story_posts.author_type IS 'Either artist (vendor) or collector';
COMMENT ON COLUMN artwork_story_posts.parent_post_id IS 'For artist replies to collector posts';
COMMENT ON COLUMN artwork_story_posts.is_artist_reply IS 'True when artist replies to a collector post - these are PUBLIC';
