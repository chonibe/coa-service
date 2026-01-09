const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function verifyView() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Verifying Comprehensive View ---');
  const { data, error } = await supabase
    .from('collector_profile_comprehensive')
    .select('user_email, display_name, total_orders, total_editions')
    .limit(10);

  if (error) {
    console.error(error);
    return;
  }

  console.table(data);
}

verifyView();

