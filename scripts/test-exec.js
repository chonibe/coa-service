const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function testExecSql() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT version();" 
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Result:', data);
}

testExecSql();

