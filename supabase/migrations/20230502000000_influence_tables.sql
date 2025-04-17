-- Create tables for the collector influence system

-- Table to track collector influence
CREATE TABLE IF NOT EXISTS collector_influence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collector_id UUID NOT NULL REFERENCES collectors(id),
  artist_id UUID NOT NULL REFERENCES artists(id),
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
  collector_id UUID NOT NULL REFERENCES collectors(id),
  artist_id UUID NOT NULL REFERENCES artists(id),
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
  collector_id UUID NOT NULL REFERENCES collectors(id),
  artist_id UUID NOT NULL REFERENCES artists(id),
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
  artist_id UUID NOT NULL REFERENCES artists(id),
  collector_id UUID NOT NULL REFERENCES collectors(id),
  recognition_type TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS artist_recognitions_artist_id_idx ON artist_recognitions(artist_id);
CREATE INDEX IF NOT EXISTS artist_recognitions_collector_id_idx ON artist_recognitions(collector_id);

-- Add trigger to update collector_influence when a new contribution is added
CREATE OR REPLACE FUNCTION update_collector_influence_on_contribution()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the contributions count
  UPDATE collector_influence
  SET 
    contributions = contributions + 1,
    updated_at = NOW()
  WHERE 
    collector_id = NEW.collector_id AND 
    artist_id = NEW.artist_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collector_influence_on_contribution_trigger
AFTER INSERT ON collector_contributions
FOR EACH ROW
EXECUTE FUNCTION update_collector_influence_on_contribution();

-- Add trigger to update collector_influence when an idea is implemented
CREATE OR REPLACE FUNCTION update_collector_influence_on_idea_implementation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.implemented = TRUE AND OLD.implemented = FALSE THEN
    -- Update the ideas_implemented count
    UPDATE collector_influence
    SET 
      ideas_implemented = ideas_implemented + 1,
      influence_points = influence_points + 100, -- Bonus points for implemented idea
      updated_at = NOW()
    WHERE 
      collector_id = NEW.collector_id AND 
      artist_id = NEW.artist_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collector_influence_on_idea_implementation_trigger
AFTER UPDATE ON collector_ideas
FOR EACH ROW
EXECUTE FUNCTION update_collector_influence_on_idea_implementation();

-- Add trigger to update collector_influence when a recognition is added
CREATE OR REPLACE FUNCTION update_collector_influence_on_recognition()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the recognition_count
  UPDATE collector_influence
  SET 
    recognition_count = recognition_count + 1,
    influence_points = influence_points + 75, -- Points for being recognized
    updated_at = NOW()
  WHERE 
    collector_id = NEW.collector_id AND 
    artist_id = NEW.artist_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collector_influence_on_recognition_trigger
AFTER INSERT ON artist_recognitions
FOR EACH ROW
EXECUTE FUNCTION update_collector_influence_on_recognition();

-- Function to update collector level based on influence points
CREATE OR REPLACE FUNCTION update_collector_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the level based on points
  IF NEW.influence_points >= 1500 THEN
    NEW.current_level := 'Co-Creator';
  ELSIF NEW.influence_points >= 700 THEN
    NEW.current_level := 'Collaborator';
  ELSIF NEW.influence_points >= 300 THEN
    NEW.current_level := 'Insider';
  ELSIF NEW.influence_points >= 100 THEN
    NEW.current_level := 'Supporter';
  ELSE
    NEW.current_level := 'Collector';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collector_level_trigger
BEFORE INSERT OR UPDATE ON collector_influence
FOR EACH ROW
EXECUTE FUNCTION update_collector_level();
