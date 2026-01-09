const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const fs = require('fs');
const path = require('path');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function applyMigration() {
  console.log('🚀 Applying migration: exclude invalid orders from editions...');
  try {
    const sqlPath = path.join(__dirname, '../supabase/migrations/20260108000011_exclude_invalid_orders_from_editions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('Error applying migration:', error);
    } else {
      console.log('✅ Successfully updated assign_edition_numbers function.');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

applyMigration();

