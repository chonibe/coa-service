const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkCollectorProfileChangesSchema() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Collector Profile Changes Schema ---');
  const { data, error } = await supabase
    .from('collector_profile_changes')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error(error);
    return;
  }

  if (data && data.length > 0) {
    console.log(Object.keys(data[0]));
  }
}

checkCollectorProfileChangesSchema();

