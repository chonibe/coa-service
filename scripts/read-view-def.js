const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function readViewDefinition() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Reading collector_profile_comprehensive definition ---');
  
  const sql = `
    SELECT view_definition 
    FROM information_schema.views 
    WHERE table_name = 'collector_profile_comprehensive'
    AND table_schema = 'public';
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log(data[0]?.view_definition);
  }
}

readViewDefinition();
