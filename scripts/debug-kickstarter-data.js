const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function debugData() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  
  if (!urlMatch || !keyMatch) {
    console.error('Could not find Supabase URL or Service Role Key in .env');
    return;
  }
  
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const email = 'paulette.nakache@gmail.com';
  console.log(`Checking data for: ${email}`);

  // Check collector_profiles table
  const { data: profiles, error: profileError } = await supabase
    .from('collector_profiles')
    .select('*')
    .ilike('email', email);

  if (profileError) {
    console.error('Error fetching profile from collector_profiles:', profileError.message);
  } else {
    console.log(`Found ${profiles.length} profiles in collector_profiles:`);
    profiles.forEach(p => console.log({
      email: p.email,
      is_kickstarter_backer: p.is_kickstarter_backer
    }));
  }

  // Check collector_profile_comprehensive view
  const { data: viewRows, error: viewError } = await supabase
    .from('collector_profile_comprehensive')
    .select('*')
    .ilike('user_email', email);

  if (viewError) {
    console.error('Error fetching data from view:', viewError.message);
  } else {
    console.log(`Found ${viewRows.length} rows in collector_profile_comprehensive view:`);
    viewRows.forEach(v => console.log({
      user_email: v.user_email,
      is_kickstarter_backer: v.is_kickstarter_backer
    }));
  }

  // Check orders table
  const orderName = '#1256';
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('order_name', orderName)
    .single();

  if (orderError) {
    console.error(`Error fetching order ${orderName}:`, orderError.message);
  } else {
    console.log(`Order ${orderName} from orders table:`, {
      order_name: order.order_name,
      kickstarter_backing_amount_gbp: order.kickstarter_backing_amount_gbp,
      kickstarter_backing_amount_usd: order.kickstarter_backing_amount_usd
    });
  }
}

debugData().catch(console.error);

