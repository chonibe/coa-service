-- Create giveaway_entries table to store giveaway data and results
CREATE TABLE IF NOT EXISTS giveaway_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_name TEXT NOT NULL,
  entry_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  winner_data JSONB,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_status ON giveaway_entries(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_created_at ON giveaway_entries(created_at DESC);

-- Enable Row Level Security
ALTER TABLE giveaway_entries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (authorization handled at application level)
CREATE POLICY allow_giveaway_operations ON giveaway_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_giveaway_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER giveaway_entries_updated_at_trigger
BEFORE UPDATE ON giveaway_entries
FOR EACH ROW
EXECUTE FUNCTION update_giveaway_entries_updated_at();

-- Create helper function to get giveaway results
CREATE OR REPLACE FUNCTION get_giveaway_history(limit_count INT DEFAULT 10, offset_count INT DEFAULT 0)
RETURNS TABLE (
  id UUID,
  giveaway_name TEXT,
  entry_data JSONB,
  winner_data JSONB,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ge.id,
    ge.giveaway_name,
    ge.entry_data,
    ge.winner_data,
    ge.status,
    ge.created_at
  FROM giveaway_entries ge
  ORDER BY ge.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
