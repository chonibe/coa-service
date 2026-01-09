const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkAdminEmails() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const adminEmails = ['chonibe@gmail.com', 'choni@thestreetlamp.com', 'info@thestreetlamp.com'];
  
  console.log('Checking warehouse_orders for admin emails...');
  for (const email of adminEmails) {
    const { data, error } = await supabase
      .from('warehouse_orders')
      .select('id, ship_name, ship_email, order_id')
      .ilike('ship_email', email);

    if (error) {
      console.error(`  Error checking ${email}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`  Found ${data.length} matches for ${email}:`);
      data.forEach(d => console.log(`    - Name: "${d.ship_name}", Email: "${d.ship_email}", Order: ${d.order_id}`));
    } else {
      console.log(`  No matches for ${email}.`);
    }
  }

  console.log('\nChecking orders for admin emails with name "Sophia Liang"...');
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('id, order_name, customer_email, customer_name')
    .in('customer_email', adminEmails)
    .ilike('customer_name', '%Sophia%');

  if (orderError) {
    console.error('  Error checking orders:', orderError.message);
  } else if (orders && orders.length > 0) {
    console.log(`  Found ${orders.length} admin orders with name "Sophia":`);
    orders.forEach(o => console.log(`    - Name: "${o.customer_name}", Email: "${o.customer_email}", Order: ${o.order_name}`));
  } else {
    console.log('  No admin orders found with name "Sophia".');
  }
}

checkAdminEmails();

