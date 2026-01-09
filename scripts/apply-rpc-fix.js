const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

async function applyMigration() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const sql = fs.readFileSync(path.resolve(__dirname, '../supabase/migrations/20260109150000_fix_assign_edition_rpc.sql'), 'utf8');
  
  console.log('Applying RPC fix migration...');
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('Migration failed:', error.message);
  } else {
    console.log('Migration applied successfully!');
  }
}

applyMigration();

