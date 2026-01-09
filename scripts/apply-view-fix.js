require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function applyFix() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, key);

  const migrationPath = 'supabase/migrations/20260109000003_fix_collector_view_ghost_profile.sql';
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Applying migration to fix ghost profile in comprehensive view...');
  
  // Apply SQL directly via RPC
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }

  console.log('Migration applied successfully.');

  // Step 2: Cleanup "null" strings and empty emails in orders table
  console.log('Cleaning up "null" values in orders table...');
  
  const { error: cleanupEmailError } = await supabase
    .from('orders')
    .update({ customer_email: null })
    .or('customer_email.eq.null,customer_email.eq.""');

  const { error: cleanupNameError } = await supabase
    .from('orders')
    .update({ customer_name: 'Guest Collector' })
    .or('customer_name.eq.null,customer_name.eq.""');

  if (cleanupEmailError) console.error('Error cleaning up emails:', cleanupEmailError.message);
  if (cleanupNameError) console.error('Error cleaning up names:', cleanupNameError.message);
  
  console.log('Database cleanup complete.');
}

applyFix();

