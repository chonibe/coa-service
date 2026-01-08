const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function check() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('collector_profile_comprehensive')
    .select('display_name, user_email, total_orders')
    .gt('total_orders', 0)
    .limit(5);
    
  if (error) {
    console.error(error);
  } else {
    console.log('Collectors with orders found:', data);
  }
}

check();

