const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function debugBittmannRaw() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('Fetching raw order for bittmannroma@gmail.com...');
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_email', 'bittmannroma@gmail.com');

  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));

  console.log('\nFetching collector_profile for bittmannroma@gmail.com...');
  const { data: profile, error: pErr } = await supabase
    .from('collector_profiles')
    .select('*')
    .eq('email', 'bittmannroma@gmail.com');

  if (pErr) console.error(pErr);
  else console.log(JSON.stringify(profile, null, 2));
}

debugBittmannRaw();

