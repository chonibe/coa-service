-- Create instagram_profiles table
CREATE TABLE IF NOT EXISTS instagram_profiles (
    vendor_id VARCHAR(255) PRIMARY KEY,
    account_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    profile_picture_url TEXT,
    biography TEXT,
    followers_count INTEGER,
    follows_count INTEGER,
    media_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create instagram_media table
CREATE TABLE IF NOT EXISTS instagram_media (
    id VARCHAR(255) PRIMARY KEY,
    vendor_id VARCHAR(255) NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    media_url TEXT NOT NULL,
    permalink TEXT NOT NULL,
    caption TEXT,
    like_count INTEGER,
    comments_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (vendor_id) REFERENCES instagram_profiles (vendor_id) ON DELETE CASCADE
);

-- Create instagram_stories table
CREATE TABLE IF NOT EXISTS instagram_stories (
    id VARCHAR(255) PRIMARY KEY,
    vendor_id VARCHAR(255) NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    media_url TEXT NOT NULL,
    permalink TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (vendor_id) REFERENCES instagram_profiles (vendor_id) ON DELETE CASCADE
);

-- Create index on vendor_id for faster queries
CREATE INDEX IF NOT EXISTS idx_instagram_media_vendor_id ON instagram_media (vendor_id);
CREATE INDEX IF NOT EXISTS idx_instagram_stories_vendor_id ON instagram_stories (vendor_id);
