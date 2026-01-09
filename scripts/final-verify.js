const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function finalVerify() {
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

  const testOrders = ['#1258', '#1214', '#1213', '#1174'];
  console.log('Final verification for key Kickstarter orders:');

  for (const name of testOrders) {
    const { data: order } = await supabase
      .from('orders')
      .select('order_name, customer_email, kickstarter_backing_amount_gbp')
      .eq('order_name', name)
      .maybeSingle();
    
    let backerStatus = 'MISSING';
    if (order?.customer_email) {
      const { data: profile } = await supabase
        .from('collector_profile_comprehensive')
        .select('is_kickstarter_backer')
        .ilike('user_email', order.customer_email)
        .maybeSingle();
      backerStatus = profile?.is_kickstarter_backer ? 'ACTIVE' : 'INACTIVE';
    }

    console.log(`Order ${name}:`);
    console.log(`  Email: ${order?.customer_email}`);
    console.log(`  Backing Amount (GBP): ${order?.kickstarter_backing_amount_gbp}`);
    console.log(`  Backer Badge Status: ${backerStatus}`);
  }
}

finalVerify().catch(console.error);

