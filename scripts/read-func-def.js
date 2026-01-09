const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function readFunction() {
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT routine_definition FROM information_schema.routines WHERE routine_name = 'assign_edition_numbers';" 
  });
  if (error) console.error(error);
  else console.log(data[0]?.routine_definition || 'Function not found');
}

readFunction();

