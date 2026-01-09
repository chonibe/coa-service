const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function finalVerify() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Final Verification of Collector Profiles ---');
  
  // 1. Check profiles count
  const { count: profileCount } = await supabase
    .from('collector_profiles')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Total Collector Profiles: ${profileCount}`);

  // 2. Check view count
  const { count: viewCount } = await supabase
    .from('collector_profile_comprehensive')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Total Comprehensive Profiles: ${viewCount}`);

  // 3. Sample a guest profile
  const { data: samples } = await supabase
    .from('collector_profile_comprehensive')
    .select('user_email, display_name, shopify_customer_id, total_orders, total_editions')
    .is('user_id', null)
    .limit(5);
  
  console.log('Sample Guest Profiles:');
  console.table(samples);
}

finalVerify();

