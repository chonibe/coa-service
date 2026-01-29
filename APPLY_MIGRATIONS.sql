-- ============================================================================
-- SLIDES FEATURE MIGRATIONS
-- Apply these in the Supabase Dashboard SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. ARTWORK_SLIDES TABLE
-- ============================================================================

DROP TABLE IF EXISTS artwork_slides CASCADE;

CREATE TABLE artwork_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  
  -- Background layer (JSONB)
  background JSONB NOT NULL DEFAULT '{"type": "gradient", "value": "dark", "scale": 1, "offsetX": 0, "offsetY": 0}',
  
  -- Canvas elements (JSONB array)
  elements JSONB DEFAULT '[]',
  
  -- Title + Caption
  title TEXT,
  caption TEXT,
  
  -- Audio layer (JSONB, optional)
  audio JSONB,
  
  -- State
  is_locked BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_artwork_slides_product_order 
  ON artwork_slides(product_id, display_order);

-- Enable RLS
ALTER TABLE artwork_slides ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Vendors can manage their product slides"
  ON artwork_slides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND p.vendor_name = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Anyone can view published slides"
  ON artwork_slides FOR SELECT
  USING (is_published = true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_artwork_slides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER artwork_slides_updated_at
  BEFORE UPDATE ON artwork_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_artwork_slides_updated_at();

-- Grant permissions
GRANT SELECT ON artwork_slides TO anon;
GRANT ALL ON artwork_slides TO authenticated;

-- ============================================================================
-- 2. ARTWORK_STORY_POSTS TABLE
-- ============================================================================

DROP TABLE IF EXISTS artwork_story_posts CASCADE;

CREATE TABLE artwork_story_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Author info
  author_type TEXT NOT NULL CHECK (author_type IN ('artist', 'collector')),
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar_url TEXT,
  
  -- Content
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'photo', 'voice_note')),
  text_content TEXT,
  media_url TEXT,
  media_thumbnail_url TEXT,
  voice_duration_seconds INTEGER,
  
  -- Location
  city TEXT,
  country TEXT,
  country_code TEXT,
  
  -- Reply threading
  parent_post_id UUID REFERENCES artwork_story_posts(id) ON DELETE CASCADE,
  is_artist_reply BOOLEAN DEFAULT false,
  
  -- State
  is_visible BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_artwork_story_posts_product 
  ON artwork_story_posts(product_id, created_at DESC);
CREATE INDEX idx_artwork_story_posts_parent 
  ON artwork_story_posts(parent_post_id);

-- Enable RLS
ALTER TABLE artwork_story_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view visible story posts"
  ON artwork_story_posts
  FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Artists can create story posts"
  ON artwork_story_posts
  FOR INSERT
  WITH CHECK (
    author_type = 'artist' AND
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id
      AND p.vendor_name = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Collectors can create story posts"
  ON artwork_story_posts
  FOR INSERT
  WITH CHECK (author_type = 'collector');

CREATE POLICY "Authors can update own posts"
  ON artwork_story_posts
  FOR UPDATE
  USING (
    (author_type = 'artist' AND author_id = (auth.jwt() ->> 'email')) OR
    (author_type = 'collector' AND author_id = (auth.jwt() ->> 'email'))
  );

CREATE POLICY "Authors can delete own posts"
  ON artwork_story_posts
  FOR DELETE
  USING (
    (author_type = 'artist' AND author_id = (auth.jwt() ->> 'email')) OR
    (author_type = 'collector' AND author_id = (auth.jwt() ->> 'email'))
  );

CREATE POLICY "Artists can moderate story posts"
  ON artwork_story_posts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id
      AND p.vendor_name = (auth.jwt() ->> 'email')
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_artwork_story_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER artwork_story_posts_updated_at
  BEFORE UPDATE ON artwork_story_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_artwork_story_posts_updated_at();

-- Grant permissions
GRANT SELECT ON artwork_story_posts TO anon;
GRANT ALL ON artwork_story_posts TO authenticated;

-- ============================================================================
-- 3. COLLECTOR_NOTIFICATIONS TABLE
-- ============================================================================

DROP TABLE IF EXISTS collector_notifications CASCADE;

CREATE TABLE collector_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  recipient_email TEXT NOT NULL,
  
  -- Notification type
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'artist_reply',
    'new_story_post',
    'artwork_update',
    'new_slide',
    'announcement'
  )),
  
  -- Reference
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  story_post_id UUID REFERENCES artwork_story_posts(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  body TEXT,
  thumbnail_url TEXT,
  action_url TEXT,
  
  -- Sender
  sender_name TEXT,
  sender_avatar_url TEXT,
  
  -- State
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_collector_notifications_recipient 
  ON collector_notifications(recipient_email, created_at DESC);
CREATE INDEX idx_collector_notifications_unread 
  ON collector_notifications(recipient_email, is_read, created_at DESC);

-- Enable RLS
ALTER TABLE collector_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view their own notifications"
  ON collector_notifications
  FOR ALL
  USING (recipient_email = (auth.jwt() ->> 'email'));

-- Trigger function for artist reply notifications
CREATE OR REPLACE FUNCTION create_artist_reply_notification()
RETURNS TRIGGER AS $$
DECLARE
  parent_author_email TEXT;
  parent_author_name TEXT;
  product_name TEXT;
  product_image TEXT;
BEGIN
  -- Only create notification for artist replies
  IF NEW.is_artist_reply = true AND NEW.parent_post_id IS NOT NULL THEN
    -- Get parent post author
    SELECT author_id, author_name INTO parent_author_email, parent_author_name
    FROM artwork_story_posts
    WHERE id = NEW.parent_post_id;
    
    -- Get product details
    SELECT name, image_url INTO product_name, product_image
    FROM products
    WHERE id = NEW.product_id;
    
    -- Create notification
    IF parent_author_email IS NOT NULL THEN
      INSERT INTO collector_notifications (
        recipient_email,
        notification_type,
        product_id,
        story_post_id,
        title,
        body,
        thumbnail_url,
        action_url,
        sender_name,
        sender_avatar_url
      ) VALUES (
        parent_author_email,
        'artist_reply',
        NEW.product_id,
        NEW.id,
        NEW.author_name || ' replied to your post',
        LEFT(NEW.text_content, 100),
        product_image,
        '/collector/artwork/' || NEW.product_id || '#story',
        NEW.author_name,
        NEW.author_avatar_url
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_artist_reply_create_notification
  AFTER INSERT ON artwork_story_posts
  FOR EACH ROW
  EXECUTE FUNCTION create_artist_reply_notification();

-- Grant permissions
GRANT ALL ON collector_notifications TO authenticated;

-- ============================================================================
-- DONE!
-- ============================================================================
