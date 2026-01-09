const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkViewForSophia() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('Searching comprehensive view for "Sophia Liang"...');
  const { data, error } = await supabase
    .from('collector_profile_comprehensive')
    .select('user_email, display_name, total_orders')
    .ilike('display_name', '%Sophia%');

  if (error) {
    console.error('Error fetching view:', error.message);
    return;
  }

  console.log(`Found ${data.length} profiles matching "Sophia":`);
  data.forEach(p => console.log(`- Email: ${p.user_email}, Name: ${p.display_name}, Orders: ${p.total_orders}`));
}

checkViewForSophia();

