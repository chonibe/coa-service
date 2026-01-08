const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function applyMigration() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  
  if (!urlMatch || !keyMatch) {
    console.error('Could not find Supabase URL or Service Role Key in .env');
    process.exit(1);
  }
  
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const migrationPath = 'supabase/migrations/20260108000006_pii_bridge_trigger.sql';
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('🚀 Applying PII Bridge Trigger migration...');
  
  // Use RPC to execute raw SQL if available, or just log instructions
  // Since we don't have a direct "execute SQL" RPC in Supabase by default,
  // we'll try to run it via the REST API if possible, but usually this requires a custom function.
  
  console.log('NOTE: Raw SQL execution via JS client requires a pre-existing "exec_sql" function.');
  console.log('Attempting to call public.exec_sql if it exists...');

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Migration failed via RPC:', error.message);
    console.log('\n--- MANUAL ACTION REQUIRED ---');
    console.log('Please copy the contents of the following file and run it in the Supabase SQL Editor:');
    console.log(migrationPath);
    console.log('-------------------------------\n');
  } else {
    console.log('✅ Migration applied successfully!');
  }
}

applyMigration();

