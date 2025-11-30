-- Migration: Add Journey Milestone System to Artwork Series
-- Adds milestone/journey tracking fields to artwork_series and creates supporting tables

-- Add milestone_config to artwork_series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artwork_series' AND column_name = 'milestone_config'
  ) THEN
    ALTER TABLE artwork_series 
    ADD COLUMN milestone_config JSONB DEFAULT '{"completion_type": "all_sold", "auto_complete": true}'::jsonb;
  END IF;
END $$;

-- Add journey_position to artwork_series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artwork_series' AND column_name = 'journey_position'
  ) THEN
    ALTER TABLE artwork_series 
    ADD COLUMN journey_position JSONB;
  END IF;
END $$;

-- Add completed_at to artwork_series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artwork_series' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE artwork_series 
    ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add completion_progress to artwork_series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artwork_series' AND column_name = 'completion_progress'
  ) THEN
    ALTER TABLE artwork_series 
    ADD COLUMN completion_progress JSONB DEFAULT '{"total_artworks": 0, "sold_artworks": 0, "percentage_complete": 0}'::jsonb;
  END IF;
END $$;

-- Add connected_series_ids to artwork_series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artwork_series' AND column_name = 'connected_series_ids'
  ) THEN
    ALTER TABLE artwork_series 
    ADD COLUMN connected_series_ids UUID[] DEFAULT ARRAY[]::UUID[];
  END IF;
END $$;

-- Add unlocks_series_ids to artwork_series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artwork_series' AND column_name = 'unlocks_series_ids'
  ) THEN
    ALTER TABLE artwork_series 
    ADD COLUMN unlocks_series_ids UUID[] DEFAULT ARRAY[]::UUID[];
  END IF;
END $$;

-- Add is_milestone to artwork_series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artwork_series' AND column_name = 'is_milestone'
  ) THEN
    ALTER TABLE artwork_series 
    ADD COLUMN is_milestone BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add milestone_order to artwork_series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artwork_series' AND column_name = 'milestone_order'
  ) THEN
    ALTER TABLE artwork_series 
    ADD COLUMN milestone_order INTEGER;
  END IF;
END $$;

-- Create journey_map_settings table
CREATE TABLE IF NOT EXISTS journey_map_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  map_style TEXT DEFAULT 'island' CHECK (map_style IN ('island', 'timeline', 'level', 'custom')),
  background_image_url TEXT,
  theme_colors JSONB DEFAULT '{}'::jsonb,
  default_series_position JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_id)
);

-- Create series_completion_history table
CREATE TABLE IF NOT EXISTS series_completion_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES artwork_series(id) ON DELETE CASCADE,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_type TEXT NOT NULL,
  final_stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_artwork_series_milestone_order ON artwork_series(milestone_order) WHERE milestone_order IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_artwork_series_is_milestone ON artwork_series(is_milestone) WHERE is_milestone = true;
CREATE INDEX IF NOT EXISTS idx_artwork_series_completed_at ON artwork_series(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_artwork_series_connected_series_ids ON artwork_series USING GIN (connected_series_ids);
CREATE INDEX IF NOT EXISTS idx_artwork_series_unlocks_series_ids ON artwork_series USING GIN (unlocks_series_ids);
CREATE INDEX IF NOT EXISTS idx_journey_map_settings_vendor_id ON journey_map_settings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_series_completion_history_series_id ON series_completion_history(series_id);
CREATE INDEX IF NOT EXISTS idx_series_completion_history_vendor_id ON series_completion_history(vendor_id);
CREATE INDEX IF NOT EXISTS idx_series_completion_history_completed_at ON series_completion_history(completed_at);

-- Create function to update updated_at timestamp for journey_map_settings
CREATE OR REPLACE FUNCTION update_journey_map_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on journey_map_settings
DROP TRIGGER IF EXISTS trigger_update_journey_map_settings_updated_at ON journey_map_settings;
CREATE TRIGGER trigger_update_journey_map_settings_updated_at
  BEFORE UPDATE ON journey_map_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_journey_map_settings_updated_at();

-- Create function to calculate series completion progress
CREATE OR REPLACE FUNCTION calculate_series_completion_progress(series_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  total_artworks_count INTEGER;
  sold_artworks_count INTEGER;
  percentage_complete NUMERIC;
  result JSONB;
BEGIN
  -- Count total artworks in series
  SELECT COUNT(*) INTO total_artworks_count
  FROM artwork_series_members
  WHERE artwork_series_members.series_id = series_id_param;

  -- Count sold artworks by matching shopify_product_id to order_line_items_v2
  SELECT COUNT(DISTINCT asm.shopify_product_id) INTO sold_artworks_count
  FROM artwork_series_members asm
  INNER JOIN order_line_items_v2 oli ON oli.product_id::TEXT = asm.shopify_product_id
  WHERE asm.series_id = series_id_param
    AND asm.shopify_product_id IS NOT NULL
    AND oli.status = 'fulfilled';

  -- Calculate percentage
  IF total_artworks_count > 0 THEN
    percentage_complete := ROUND((sold_artworks_count::NUMERIC / total_artworks_count::NUMERIC) * 100, 2);
  ELSE
    percentage_complete := 0;
  END IF;

  -- Build result JSONB
  result := jsonb_build_object(
    'total_artworks', total_artworks_count,
    'sold_artworks', sold_artworks_count,
    'percentage_complete', percentage_complete
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to check and auto-complete series if threshold is met
CREATE OR REPLACE FUNCTION check_and_complete_series(series_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  series_record RECORD;
  progress JSONB;
  completion_type TEXT;
  completion_threshold NUMERIC;
  auto_complete BOOLEAN;
  percentage_complete NUMERIC;
  total_artworks INTEGER;
  sold_artworks INTEGER;
  should_complete BOOLEAN := false;
BEGIN
  -- Get series configuration
  SELECT 
    milestone_config,
    completed_at,
    completion_progress
  INTO series_record
  FROM artwork_series
  WHERE id = series_id_param;

  -- If already completed, return false
  IF series_record.completed_at IS NOT NULL THEN
    RETURN false;
  END IF;

  -- Extract configuration
  completion_type := COALESCE(series_record.milestone_config->>'completion_type', 'all_sold');
  completion_threshold := COALESCE((series_record.milestone_config->>'completion_threshold')::NUMERIC, 100);
  auto_complete := COALESCE((series_record.milestone_config->>'auto_complete')::BOOLEAN, true);

  -- If auto_complete is false, don't auto-complete
  IF NOT auto_complete THEN
    RETURN false;
  END IF;

  -- Calculate current progress
  progress := calculate_series_completion_progress(series_id_param);
  percentage_complete := COALESCE((progress->>'percentage_complete')::NUMERIC, 0);
  total_artworks := COALESCE((progress->>'total_artworks')::INTEGER, 0);
  sold_artworks := COALESCE((progress->>'sold_artworks')::INTEGER, 0);

  -- Determine if should complete based on completion_type
  CASE completion_type
    WHEN 'all_sold' THEN
      should_complete := (sold_artworks >= total_artworks AND total_artworks > 0);
    WHEN 'percentage_sold' THEN
      should_complete := (percentage_complete >= completion_threshold);
    WHEN 'manual' THEN
      should_complete := false; -- Manual completion only
    ELSE
      should_complete := false;
  END CASE;

  -- If should complete, mark as completed
  IF should_complete THEN
    UPDATE artwork_series
    SET 
      completed_at = NOW(),
      completion_progress = progress
    WHERE id = series_id_param;

    -- Record in completion history
    INSERT INTO series_completion_history (
      series_id,
      vendor_id,
      completed_at,
      completion_type,
      final_stats
    )
    SELECT 
      id,
      vendor_id,
      NOW(),
      completion_type,
      progress
    FROM artwork_series
    WHERE id = series_id_param;

    RETURN true;
  ELSE
    -- Just update progress without completing
    UPDATE artwork_series
    SET completion_progress = progress
    WHERE id = series_id_param;

    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for new tables
DO $$
BEGIN
  -- Enable RLS on journey_map_settings
  ALTER TABLE journey_map_settings ENABLE ROW LEVEL SECURITY;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'journey_map_settings' 
    AND policyname = 'allow_all_with_app_auth'
  ) THEN
    CREATE POLICY allow_all_with_app_auth ON journey_map_settings
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Enable RLS on series_completion_history
  ALTER TABLE series_completion_history ENABLE ROW LEVEL SECURITY;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'series_completion_history' 
    AND policyname = 'allow_all_with_app_auth'
  ) THEN
    CREATE POLICY allow_all_with_app_auth ON series_completion_history
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
