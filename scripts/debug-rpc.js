const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const sql = "CREATE OR REPLACE VIEW debug_view AS SELECT raw_shopify_order_data->'customer' FROM orders LIMIT 1";
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Error executing SQL via RPC:', error);
  } else {
    console.log('Successfully created debug_view.');
  }
}

run();
