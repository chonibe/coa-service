const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);

  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

  // Finding the real order name for 12182601859458
  const { data: realOrder } = await supabase.from('orders').select('id, order_name, order_number').eq('id', '12182601859458').single();
  const platformId = realOrder.order_name || '#' + realOrder.order_number;

  console.log(`--- Simulation: Warehouse Sync for ${platformId} ---`);

  // 1. Cross-reference with our 'orders' table
  console.log(`Searching for order in DB matching ID or Name: ${platformId}`);
  const { data: dbOrder, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, customer_id, customer_email, order_name')
    .or(`id.eq.${realOrder.id},order_name.eq.${platformId}`)
    .maybeSingle();

  if (orderError) {
    console.error('Error finding order:', orderError);
    return;
  }

  if (!dbOrder) {
    console.log('No order found matching that platform ID.');
    return;
  }

  console.log('✅ Found Order in Database:');
  console.log(`- Long Shopify ID: ${dbOrder.id}`);
  console.log(`- Shopify Customer ID: ${dbOrder.customer_id || 'NOT LINKED IN SHOPIFY'}`);
  console.log(`- DB Order Name: ${dbOrder.order_name}`);

  // 2. Capture and Linkage Simulation
  const ownerEmail = "collector-demo@example.com";
  const ownerName = "Demo Collector";
  const customerId = dbOrder.customer_id;

  console.log('\n--- Linkage Result ---');
  console.log(`Will link Edition to:`);
  console.log(`- Email (from Warehouse): ${ownerEmail}`);
  console.log(`- Name (from Warehouse): ${ownerName}`);
  console.log(`- Customer ID (from Shopify): ${customerId || 'N/A'}`);

  // 3. Check for Supabase User
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('email', ownerEmail)
    .maybeSingle();

  if (userData) {
    console.log(`- ✅ Matched Supabase User UUID: ${userData.id}`);
  } else {
    console.log(`- ℹ️ No Supabase user found for this email yet (Guest)`);
  }
}

run();
