const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = "https://ldmppmnpgdxueebkkpid.supabase.co";
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const key = keyMatch[1].trim();
  const s = createClient(url, key);
  
  const { data, error } = await s.from('crm_customers').select('*').limit(1);
  if (error) {
    console.log('crm_customers table error:', error.message);
  } else {
    console.log('crm_customers Columns:', data.length > 0 ? Object.keys(data[0]) : 'Empty');
  }
}

run();
