const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = "https://ldmppmnpgdxueebkkpid.supabase.co";
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const key = keyMatch[1].trim();
  const s = createClient(url, key);
  
  const { data } = await s.from('crm_customers').select('id').limit(1);
  console.log('CRM Customer ID sample:', data[0].id);
}

run();

