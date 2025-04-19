-- Create tables for caching Instagram data

-- Profile cache
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

-- Media cache
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
  children TEXT, -- JSON string for carousel albums
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(username, instagram_media_id)
);

-- Stories cache
CREATE TABLE IF NOT EXISTS instagram_stories_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instagram_media_id TEXT NOT NULL,
  username TEXT NOT NULL,
  media_type TEXT NOT NULL,
  media_url TEXT NOT NULL,
  permalink TEXT NOT NULL,
  thumbnail_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(username, instagram_media_id)
);

-- Story views
CREATE TABLE IF NOT EXISTS instagram_story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collector_id UUID NOT NULL,
  instagram_media_id TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(collector_id, instagram_media_id)
);

-- Create indexes
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
