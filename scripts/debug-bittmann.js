const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function debugPhilipBittmann() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const email = 'bittmannroma@gmail.com';
  const orderName = '#1182';

  console.log(`Checking order ${orderName}...`);
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*')
    .eq('order_name', orderName)
    .maybeSingle();

  if (orderErr) console.error('Error fetching order:', orderErr.message);
  else console.log('Order Data:', JSON.stringify(order, null, 2));

  console.log(`\nChecking collector_profile for ${email}...`);
  const { data: profile, error: profileErr } = await supabase
    .from('collector_profiles')
    .select('*')
    .ilike('email', email)
    .maybeSingle();

  if (profileErr) console.error('Error fetching profile:', profileErr.message);
  else console.log('Profile Data:', JSON.stringify(profile, null, 2));

  console.log(`\nChecking comprehensive view for ${email}...`);
  const { data: view, error: viewErr } = await supabase
    .from('collector_profile_comprehensive')
    .select('*')
    .ilike('user_email', email)
    .maybeSingle();

  if (viewErr) console.error('Error fetching view:', viewErr.message);
  else console.log('View Data:', JSON.stringify(view, null, 2));

  console.log(`\nChecking warehouse_orders for ${email}...`);
  const { data: wh, error: whErr } = await supabase
    .from('warehouse_orders')
    .select('*')
    .ilike('ship_email', email);

  if (whErr) console.error('Error fetching warehouse:', whErr.message);
  else console.log('Warehouse Data Count:', wh?.length || 0);
}

debugPhilipBittmann();

