const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function debugProfile() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const email = 'bittmannroma@gmail.com';
  const { data, error } = await supabase
    .from('collector_profiles')
    .select('*')
    .eq('email', email);

  console.log(`Profile for ${email}:`, JSON.stringify(data, null, 2));
}

debugProfile();

