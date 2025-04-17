-- Create tables for engagement mechanics

-- Table to track collector views
CREATE TABLE IF NOT EXISTS collector_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collector_id UUID NOT NULL REFERENCES collectors(id),
  certificate_id UUID NOT NULL REFERENCES certificates(id),
  artist_id UUID NOT NULL REFERENCES artists(id),
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS collector_views_collector_id_idx ON collector_views(collector_id);
CREATE INDEX IF NOT EXISTS collector_views_certificate_id_idx ON collector_views(certificate_id);
CREATE INDEX IF NOT EXISTS collector_views_viewed_at_idx ON collector_views(viewed_at);

-- Table to track streak rewards
CREATE TABLE IF NOT EXISTS streak_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collector_id UUID NOT NULL REFERENCES collectors(id),
  artist_id UUID NOT NULL REFERENCES artists(id),
  streak_count INTEGER NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  reward_type TEXT,
  reward_data JSONB
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS streak_rewards_collector_id_idx ON streak_rewards(collector_id);
CREATE INDEX IF NOT EXISTS streak_rewards_claimed_idx ON streak_rewards(claimed);

-- Add expiry fields to perks table if they don't exist
ALTER TABLE perks ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE perks ADD COLUMN IF NOT EXISTS is_limited BOOLEAN DEFAULT FALSE;
ALTER TABLE perks ADD COLUMN IF NOT EXISTS limited_quantity INTEGER;
ALTER TABLE perks ADD COLUMN IF NOT EXISTS claimed_count INTEGER DEFAULT 0;

-- Create a function to update perk claimed count
CREATE OR REPLACE FUNCTION increment_perk_claimed_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE perks
  SET claimed_count = claimed_count + 1
  WHERE id = NEW.perk_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update claimed count when a collector views a perk
CREATE TRIGGER increment_perk_claimed_count_trigger
AFTER INSERT ON collector_perks
FOR EACH ROW
EXECUTE FUNCTION increment_perk_claimed_count();
