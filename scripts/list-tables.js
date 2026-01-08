const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = "https://ldmppmnpgdxueebkkpid.supabase.co";
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const key = keyMatch[1].trim();
  const s = createClient(url, key);
  
  const { data, error } = await s.rpc('get_tables');
  if (error) {
    // If get_tables doesn't exist, try a manual query to information_schema
    const { data: tables, error: schemaError } = await s.from('pg_tables').select('tablename').eq('schemaname', 'public');
    if (schemaError) {
        // Last resort: try to just list some likely tables
        console.error('Could not list tables:', schemaError);
    } else {
        console.log('Tables:', tables.map(t => t.tablename));
    }
  } else {
    console.log('Tables:', data);
  }
}

run();
