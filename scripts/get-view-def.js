const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function getViewDef() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT view_definition FROM information_schema.views WHERE table_name = 'collector_profile_comprehensive' AND table_schema = 'public'" 
  });
  
  if (error) console.error(error);
  else if (data && data.success) {
    console.log(data.result);
  } else {
    console.log('Error:', data);
  }
}

getViewDef();

