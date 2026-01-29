#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyRemainingTables() {
  console.log('🔧 Applying remaining tables...\n')

  // Apply story posts table
  const storyPostsSQL = `
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

    -- Grant permissions
    GRANT SELECT ON artwork_story_posts TO anon;
    GRANT ALL ON artwork_story_posts TO authenticated;
  `

  console.log('📝 Creating artwork_story_posts table...')
  const { data: storyData, error: storyError } = await supabase.rpc('exec_sql', { sql_query: storyPostsSQL })

  if (storyError) {
    console.error('❌ Error creating story posts table:', storyError)
    return
  }

  console.log('✅ Story posts table created successfully')

  // Apply notifications table
  const notificationsSQL = `
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

    -- Grant permissions
    GRANT ALL ON collector_notifications TO authenticated;
  `

  console.log('📝 Creating collector_notifications table...')
  const { data: notifData, error: notifError } = await supabase.rpc('exec_sql', { sql_query: notificationsSQL })

  if (notifError) {
    console.error('❌ Error creating notifications table:', notifError)
    return
  }

  console.log('✅ Notifications table created successfully')

  // Apply policies for story posts
  const storyPoliciesSQL = `
    -- RLS Policies for story posts
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
          WHERE p.id::text = artwork_story_posts.product_id::text
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
          WHERE p.id::text = artwork_story_posts.product_id::text
          AND p.vendor_name = (auth.jwt() ->> 'email')
        )
      );
  `

  console.log('📝 Applying story posts policies...')
  const { data: storyPolicyData, error: storyPolicyError } = await supabase.rpc('exec_sql', { sql_query: storyPoliciesSQL })

  if (storyPolicyError) {
    console.error('❌ Error applying story policies:', storyPolicyError)
    return
  }

  console.log('✅ Story posts policies applied successfully')

  // Apply policies for notifications
  const notificationPoliciesSQL = `
    CREATE POLICY "Users can view their own notifications"
      ON collector_notifications
      FOR ALL
      USING (recipient_email = (auth.jwt() ->> 'email'));
  `

  console.log('📝 Applying notification policies...')
  const { data: notifPolicyData, error: notifPolicyError } = await supabase.rpc('exec_sql', { sql_query: notificationPoliciesSQL })

  if (notifPolicyError) {
    console.error('❌ Error applying notification policies:', notifPolicyError)
    return
  }

  console.log('✅ Notification policies applied successfully')

  // Apply triggers
  const triggersSQL = `
    -- Update trigger functions
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

    -- Notification trigger function
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
        WHERE id::text = NEW.product_id::text;

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
  `

  console.log('📝 Applying triggers...')
  const { data: triggerData, error: triggerError } = await supabase.rpc('exec_sql', { sql_query: triggersSQL })

  if (triggerError) {
    console.error('❌ Error applying triggers:', triggerError)
    return
  }

  console.log('✅ Triggers applied successfully')

  // Test all tables
  console.log('\n🧪 Testing all tables...')

  const tests = [
    { table: 'artwork_slides', query: 'SELECT COUNT(*) as count FROM artwork_slides' },
    { table: 'artwork_story_posts', query: 'SELECT COUNT(*) as count FROM artwork_story_posts' },
    { table: 'collector_notifications', query: 'SELECT COUNT(*) as count FROM collector_notifications' }
  ]

  for (const test of tests) {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: test.query })
    if (error) {
      console.error(`❌ Error testing ${test.table}:`, error)
    } else {
      console.log(`✅ ${test.table}: OK`)
    }
  }

  console.log('\n🎉 All tables created successfully!')
}

applyRemainingTables().catch(console.error)
