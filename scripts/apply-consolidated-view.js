require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function applyConsolidatedView() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, key);

  const migrationPath = 'supabase/migrations/20260109000009_view_with_order_name_linkage.sql';
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('🚀 Applying final consolidated collector view migration...');
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }

  console.log('✅ Migration applied successfully!');
}

applyConsolidatedView();

