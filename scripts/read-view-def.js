const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function readView() {
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT definition FROM pg_views WHERE viewname = 'collector_profile_comprehensive';" 
  });
  if (error) console.error(error);
  else console.log(data[0].definition);
}

readView();

