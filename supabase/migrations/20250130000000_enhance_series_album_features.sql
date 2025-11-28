-- Migration: Enhance Series with Album Features
-- Adds release_date, genre_tags, unlock_progress, and unlock_milestones fields

-- Add release_date to artwork_series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artwork_series' AND column_name = 'release_date'
  ) THEN
    ALTER TABLE artwork_series 
    ADD COLUMN release_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add genre_tags to artwork_series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artwork_series' AND column_name = 'genre_tags'
  ) THEN
    ALTER TABLE artwork_series 
    ADD COLUMN genre_tags JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add unlock_progress tracking to artwork_series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artwork_series' AND column_name = 'unlock_progress'
  ) THEN
    ALTER TABLE artwork_series 
    ADD COLUMN unlock_progress JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add unlock_milestones to artwork_series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artwork_series' AND column_name = 'unlock_milestones'
  ) THEN
    ALTER TABLE artwork_series 
    ADD COLUMN unlock_milestones JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create index for release_date for sorting
CREATE INDEX IF NOT EXISTS idx_artwork_series_release_date ON artwork_series(release_date) WHERE release_date IS NOT NULL;

-- Create index for genre_tags for filtering
CREATE INDEX IF NOT EXISTS idx_artwork_series_genre_tags ON artwork_series USING GIN (genre_tags);

