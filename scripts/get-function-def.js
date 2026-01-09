const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'assign_edition_numbers'" 
  });

  if (error) {
    console.error('Error fetching function definition:', error);
  } else {
    console.log('Function Definition:', data[0].pg_get_functiondef);
  }
}

run();
