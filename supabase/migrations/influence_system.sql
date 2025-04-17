-- Create tables for the collector influence system if they don't exist

-- Table to track collector views
CREATE TABLE IF NOT EXISTS collector_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collector_id UUID NOT NULL,
  certificate_id TEXT NOT NULL,
  artist_id TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS collector_views_collector_id_idx ON collector_views(collector_id);
CREATE INDEX IF NOT EXISTS collector_views_certificate_id_idx ON collector_views(certificate_id);
CREATE INDEX IF NOT EXISTS collector_views_viewed_at_idx ON collector_views(viewed_at);

-- Table to track streak rewards
CREATE TABLE IF NOT EXISTS streak_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collector_id UUID NOT NULL,
  artist_id TEXT NOT NULL,
  streak_count INTEGER NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  claimed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS streak_rewards_collector_id_idx ON streak_rewards(collector_id);
CREATE INDEX IF NOT EXISTS streak_rewards_claimed_idx ON streak_rewards(claimed);

-- Table to track collector influence
CREATE TABLE IF NOT EXISTS collector_influence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collector_id UUID NOT NULL,
  artist_id TEXT NOT NULL,
  influence_points INTEGER NOT NULL DEFAULT 0,
  current_level TEXT NOT NULL DEFAULT 'Collector',
  contributions INTEGER NOT NULL DEFAULT 0,
  feedback_count INTEGER NOT NULL DEFAULT 0,
  ideas_implemented INTEGER NOT NULL DEFAULT 0,
  recognition_count INTEGER NOT NULL DEFAULT 0,
  last_action_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(collector_id, artist_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS collector_influence_collector_id_idx ON collector_influence(collector_id);
CREATE INDEX IF NOT EXISTS collector_influence_artist_id_idx ON collector_influence(artist_id);
CREATE INDEX IF NOT EXISTS collector_influence_points_idx ON collector_influence(influence_points);

-- Table to track collector contributions
CREATE TABLE IF NOT EXISTS collector_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collector_id UUID NOT NULL,
  artist_id TEXT NOT NULL,
  contribution_type TEXT NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS collector_contributions_collector_id_idx ON collector_contributions(collector_id);
CREATE INDEX IF NOT EXISTS collector_contributions_artist_id_idx ON collector_contributions(artist_id);
CREATE INDEX IF NOT EXISTS collector_contributions_created_at_idx ON collector_contributions(created_at);

-- Table to track collector ideas
CREATE TABLE IF NOT EXISTS collector_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collector_id UUID NOT NULL,
  artist_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  implemented BOOLEAN NOT NULL DEFAULT FALSE,
  implemented_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS collector_ideas_collector_id_idx ON collector_ideas(collector_id);
CREATE INDEX IF NOT EXISTS collector_ideas_artist_id_idx ON collector_ideas(artist_id);
CREATE INDEX IF NOT EXISTS collector_ideas_implemented_idx ON collector_ideas(implemented);

-- Table to track artist recognitions of collectors
CREATE TABLE IF NOT EXISTS artist_recognitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id TEXT NOT NULL,
  collector_id UUID NOT NULL,
  recognition_type TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS artist_recognitions_artist_id_idx ON artist_recognitions(artist_id);
CREATE INDEX IF NOT EXISTS artist_recognitions_collector_id_idx ON artist_recognitions(collector_id);
