-- Create table for storing Instagram Graph API credentials
CREATE TABLE IF NOT EXISTS instagram_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id),
  page_id TEXT NOT NULL,
  instagram_business_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(artist_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS instagram_credentials_artist_id_idx ON instagram_credentials(artist_id);

-- Create table for caching Instagram media
CREATE TABLE IF NOT EXISTS instagram_media_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id),
  instagram_media_id TEXT NOT NULL,
  media_type TEXT NOT NULL,
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  permalink TEXT NOT NULL,
  caption TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(artist_id, instagram_media_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS instagram_media_cache_artist_id_idx ON instagram_media_cache(artist_id);
CREATE INDEX IF NOT EXISTS instagram_media_cache_timestamp_idx ON instagram_media_cache(timestamp);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_instagram_credentials_updated_at
BEFORE UPDATE ON instagram_credentials
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instagram_media_cache_updated_at
BEFORE UPDATE ON instagram_media_cache
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
