const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkCRM() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('Checking crm_customers for "bittmann"...');
  const { data, error } = await supabase
    .from('crm_customers')
    .select('*')
    .or('first_name.ilike.%bittmann%,last_name.ilike.%bittmann%,email.ilike.%bittmann%');

  if (error) console.error(error);
  else {
    console.log(`Found ${data.length} matches:`);
    data.forEach(d => console.log(`- ${d.first_name} ${d.last_name}, Email: ${d.email}`));
  }
}

checkCRM();

