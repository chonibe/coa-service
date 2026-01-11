const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, key);

  console.log('--- Applying Ink-O-Gatchi Migration ---');
  
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260109000006_inkogatchi_system.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split SQL by statements if needed, or try as one block
  // Postgres enum alterations usually need to be in separate transactions or specific blocks
  // but let's try the whole file first.
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }

  console.log('✅ Migration applied successfully!');
}

applyMigration();

