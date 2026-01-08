const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const sql = fs.readFileSync('supabase/migrations/20250131000020_recreate_collector_profile_view.sql', 'utf8');
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    // If exec_sql doesn't exist, we might need another way
    console.error('Error executing SQL via RPC:', error);
    
    // Fallback: try to run it via the API if possible, but standard REST API doesn't support raw SQL
    // In this environment, we might need the user to run it via Supabase Dashboard if we can't.
    // However, I'll try to find if there's an existing script that does this.
  } else {
    console.log('Successfully recreated collector_profile_comprehensive view.');
  }
}

run();
