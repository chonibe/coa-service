-- Notifications Table
-- For story updates, artist replies, and other events

CREATE TABLE IF NOT EXISTS collector_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  recipient_email TEXT NOT NULL,
  
  -- Notification type
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'artist_reply',      -- Artist replied to your post
    'new_story_post',    -- New post on an artwork you own
    'artwork_update',    -- Artist updated the artwork page
    'new_slide',         -- New reel slide added
    'announcement'       -- Platform/artist announcement
  )),
  
  -- Reference
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  story_post_id UUID REFERENCES artwork_story_posts(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  body TEXT,
  thumbnail_url TEXT,
  action_url TEXT, -- Deep link
  
  -- Sender (for replies/posts)
  sender_name TEXT,
  sender_avatar_url TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON collector_notifications(recipient_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON collector_notifications(recipient_email, is_read, is_dismissed) WHERE is_read = false AND is_dismissed = false;
CREATE INDEX IF NOT EXISTS idx_notifications_product ON collector_notifications(product_id);

-- RLS
ALTER TABLE collector_notifications ENABLE ROW LEVEL SECURITY;

-- Collectors can only see their own notifications
CREATE POLICY "Collectors can view own notifications"
  ON collector_notifications
  FOR SELECT
  USING (recipient_email = auth.jwt() ->> 'email');

-- System can create notifications (will be done via service role)
CREATE POLICY "System can create notifications"
  ON collector_notifications
  FOR INSERT
  WITH CHECK (true);

-- Collectors can update their own (read, dismiss)
CREATE POLICY "Collectors can update own notifications"
  ON collector_notifications
  FOR UPDATE
  USING (recipient_email = auth.jwt() ->> 'email');

-- Function to create notification when artist replies
CREATE OR REPLACE FUNCTION create_artist_reply_notification()
RETURNS TRIGGER AS $$
DECLARE
  parent_author_email TEXT;
  product_name TEXT;
  product_image TEXT;
BEGIN
  -- Only for artist replies
  IF NEW.is_artist_reply = true AND NEW.parent_post_id IS NOT NULL THEN
    -- Get parent post author email
    SELECT author_id INTO parent_author_email
    FROM artwork_story_posts
    WHERE id = NEW.parent_post_id AND author_type = 'collector';
    
    -- Get product info
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

-- Trigger for artist reply notifications
CREATE TRIGGER on_artist_reply_create_notification
  AFTER INSERT ON artwork_story_posts
  FOR EACH ROW
  EXECUTE FUNCTION create_artist_reply_notification();

COMMENT ON TABLE collector_notifications IS 'Push/in-app notifications for collectors';
