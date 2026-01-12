const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkRpcSource() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT proname, prosrc, pg_get_function_arguments(oid) as args FROM pg_proc WHERE proname ILIKE '%assign_edition%';" 
  });

  if (error) {
    console.error('Error fetching RPC source:', error);
    return;
  }

  console.log('Edition Assignment Functions:');
  data.forEach(fn => {
    console.log(`\n--- ${fn.proname}(${fn.args}) ---`);
    // console.log(fn.prosrc);
  });
}

checkRpcSource();
