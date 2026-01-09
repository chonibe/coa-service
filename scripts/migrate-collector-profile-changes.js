const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function migrateCollectorProfileChanges() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Migrating Collector Profile Changes Table ---');
  
  const sql = `
    -- Allow NULL user_id for change logs of guest profiles
    ALTER TABLE public.collector_profile_changes ALTER COLUMN user_id DROP NOT NULL;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Migration Error:', error.message);
  } else {
    console.log('Migration Successful!');
  }
}

migrateCollectorProfileChanges();

