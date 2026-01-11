const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function updateSchema() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, key);

  console.log('--- Updating Ink-O-Gatchi Schema for Collectible System ---');
  
  const sql = `
    -- 1. Update constraints
    ALTER TABLE avatar_items DROP CONSTRAINT IF EXISTS avatar_items_type_check;
    ALTER TABLE avatar_items ADD CONSTRAINT avatar_items_type_check CHECK (type IN ('base', 'hat', 'eyes', 'body', 'accessory', 'design'));

    -- 2. Add rarity and metadata
    ALTER TABLE avatar_items ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'Common';
    ALTER TABLE avatar_items ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

    -- 3. Insert some vendor-specific base items (examples)
    -- We will link these to real artist_id's later in the UI
    INSERT INTO public.avatar_items (type, name, asset_url, credit_cost, required_level, rarity, metadata)
    VALUES 
        ('base', 'Street Collector Classic', 'classic', 0, 1, 'Common', '{"color": "#A0A0A0"}'),
        ('base', 'Vandal Gold', 'vandal', 5000, 10, 'Legendary', '{"color": "#F8E71C", "effect": "glow"}'),
        ('design', 'Chrome Wrap', 'chrome', 1000, 5, 'Rare', '{"finish": "metallic"}'),
        ('design', 'Midnight Splatter', 'splatter', 500, 3, 'Uncommon', '{"finish": "matte", "pattern": "splatter"}')
    ON CONFLICT DO NOTHING;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  }

  console.log('✅ Schema updated successfully!');
}

updateSchema();

