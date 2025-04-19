-- Create sync_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS sync_logs (
 id SERIAL PRIMARY KEY,
 created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 details JSONB,
 type VARCHAR(255) DEFAULT 'shopify_orders'
);

-- Create sync_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS sync_status (
 id SERIAL PRIMARY KEY,
 created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 details JSONB,
 type VARCHAR(255) DEFAULT 'shopify_orders'
);

-- Create webhook_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS webhook_logs (
 id SERIAL PRIMARY KEY,
 created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 details JSONB,
 type VARCHAR(255) DEFAULT 'shopify_order'
);

-- Create order_line_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_line_items (
 id SERIAL PRIMARY KEY,
 order_id VARCHAR(255) NOT NULL,
 order_name VARCHAR(255),
 line_item_id VARCHAR(255) NOT NULL,
 product_id VARCHAR(255) NOT NULL,
 variant_id VARCHAR(255),
 edition_number INTEGER,
 edition_total INTEGER,
 created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 status VARCHAR(50) DEFAULT 'active',
 removed_reason TEXT,
 UNIQUE(order_id, line_item_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_line_items_order_id ON order_line_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_line_items_product_id ON order_line_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_line_items_status ON order_line_items(status);
CREATE INDEX IF NOT EXISTS idx_order_line_items_created_at ON order_line_items(created_at);

-- Add certificate fields to order_line_items table
ALTER TABLE order_line_items 
ADD COLUMN IF NOT EXISTS certificate_url TEXT,
ADD COLUMN IF NOT EXISTS certificate_token TEXT,
ADD COLUMN IF NOT EXISTS certificate_generated_at TIMESTAMP WITH TIME ZONE;

-- Create certificate access logs table
CREATE TABLE IF NOT EXISTS certificate_access_logs (
 id SERIAL PRIMARY KEY,
 line_item_id TEXT NOT NULL,
 order_id TEXT NOT NULL,
 product_id TEXT NOT NULL,
 accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 ip_address TEXT,
 user_agent TEXT,
 FOREIGN KEY (line_item_id, order_id) REFERENCES order_line_items (line_item_id, order_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_certificate_access_logs_line_item_id ON certificate_access_logs(line_item_id);
CREATE INDEX IF NOT EXISTS idx_certificate_access_logs_accessed_at ON certificate_access_logs(accessed_at);

-- Create Instagram profile cache table
CREATE TABLE IF NOT EXISTS instagram_profile_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  profile_picture_url TEXT,
  followers_count INTEGER,
  media_count INTEGER,
  biography TEXT,
  name TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create Instagram media cache table
CREATE TABLE IF NOT EXISTS instagram_media_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instagram_media_id TEXT NOT NULL,
  username TEXT NOT NULL,
  media_type TEXT NOT NULL,
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  permalink TEXT NOT NULL,
  caption TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(username, instagram_media_id)
);

-- Create Instagram stories cache table
CREATE TABLE IF NOT EXISTS instagram_stories_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instagram_media_id TEXT NOT NULL,
  username TEXT NOT NULL,
  media_type TEXT NOT NULL,
  media_url TEXT NOT NULL,
  permalink TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(username, instagram_media_id)
);

-- Create Instagram story views table
CREATE TABLE IF NOT EXISTS instagram_story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collector_id UUID NOT NULL,
  instagram_media_id TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(collector_id, instagram_media_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS instagram_media_cache_username_idx ON instagram_media_cache(username);
CREATE INDEX IF NOT EXISTS instagram_media_cache_timestamp_idx ON instagram_media_cache(timestamp);
CREATE INDEX IF NOT EXISTS instagram_stories_cache_username_idx ON instagram_stories_cache(username);
CREATE INDEX IF NOT EXISTS instagram_stories_cache_timestamp_idx ON instagram_stories_cache(timestamp);
CREATE INDEX IF NOT EXISTS instagram_story_views_collector_id_idx ON instagram_story_views(collector_id);
CREATE INDEX IF NOT EXISTS instagram_story_views_instagram_media_id_idx ON instagram_story_views(instagram_media_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_instagram_profile_cache_updated_at
BEFORE UPDATE ON instagram_profile_cache
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instagram_media_cache_updated_at
BEFORE UPDATE ON instagram_media_cache
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instagram_stories_cache_updated_at
BEFORE UPDATE ON instagram_stories_cache
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
