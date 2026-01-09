const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkSophiaLiang() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('Checking for Sophia Liang in collector_profiles...');
  const { data, error } = await supabase
    .from('collector_profiles')
    .select('id, email, first_name, last_name')
    .ilike('first_name', 'Sophia')
    .ilike('last_name', 'Liang');

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log(`Found ${data.length} profiles with name Sophia Liang.`);
  if (data.length > 0) {
    console.log('Sample profiles:');
    data.slice(0, 10).forEach(p => console.log(`- ID: ${p.id}, Email: ${p.email}`));
  }

  // Also check if many orders have her name in raw_shopify_order_data but different emails
  console.log('\nChecking orders for Sophia Liang...');
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('id, order_name, customer_email, customer_name')
    .ilike('customer_name', 'Sophia Liang')
    .limit(10);

  if (orderError) {
    console.error('Error fetching orders:', orderError);
  } else {
    console.log(`Found sample orders with name Sophia Liang:`);
    orders.forEach(o => console.log(`- Order: ${o.order_name}, Email: ${o.customer_email}, Name: ${o.customer_name}`));
  }
}

checkSophiaLiang();

