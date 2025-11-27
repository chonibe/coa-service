-- Migration to add profile_image and artist_history fields to vendors table

DO $$
BEGIN
  -- Add profile_image column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' AND column_name = 'profile_image'
  ) THEN
    ALTER TABLE vendors ADD COLUMN profile_image TEXT;
  END IF;

  -- Add artist_history column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' AND column_name = 'artist_history'
  ) THEN
    ALTER TABLE vendors ADD COLUMN artist_history TEXT;
  END IF;
END $$;

