-- Create rewards tables
CREATE TABLE IF NOT EXISTS customer_rewards (
    id SERIAL PRIMARY KEY,
    customer_id TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    level TEXT DEFAULT 'bronze',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reward events table
CREATE TABLE IF NOT EXISTS reward_events (
    id SERIAL PRIMARY KEY,
    customer_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    points_earned INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reward tiers table
CREATE TABLE IF NOT EXISTS reward_tiers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    required_points INTEGER NOT NULL,
    benefits TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_rewards_customer_id ON customer_rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_reward_events_customer_id ON reward_events(customer_id);

-- Insert default reward tiers
INSERT INTO reward_tiers (name, required_points, benefits)
VALUES 
    ('Bronze', 0, ARRAY['Basic benefits']),
    ('Silver', 500, ARRAY['Basic benefits', 'Exclusive content']),
    ('Gold', 1000, ARRAY['Basic benefits', 'Exclusive content', 'Early access']),
    ('Platinum', 2500, ARRAY['Basic benefits', 'Exclusive content', 'Early access', 'VIP benefits'])
ON CONFLICT (name) DO NOTHING;

-- Add function to update customer level based on points
CREATE OR REPLACE FUNCTION update_customer_level()
RETURNS TRIGGER AS $$
BEGIN
    -- Update level based on points
    UPDATE customer_rewards
    SET level = (
        SELECT name
        FROM reward_tiers
        WHERE required_points <= NEW.points
        ORDER BY required_points DESC
        LIMIT 1
    )
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update level when points change
CREATE TRIGGER update_customer_level_trigger
AFTER UPDATE OF points ON customer_rewards
FOR EACH ROW
EXECUTE FUNCTION update_customer_level(); 