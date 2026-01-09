const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function finalVerification() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('Verifying profile for chonibe@gmail.com...');
  const { data, error } = await supabase
    .from('collector_profile_comprehensive')
    .select('user_email, display_name, total_orders')
    .eq('user_email', 'chonibe@gmail.com')
    .single();

  if (error) {
    console.error('Error fetching profile:', error.message);
  } else {
    console.log('Result:', data);
  }
}

finalVerification();

