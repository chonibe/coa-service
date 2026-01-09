const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkSpecificOrders() {
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

  const orderNames = ['#1102', '#1101', '#1100', '#1099', '#1098', '#1010'];
  console.log('Checking orders:', orderNames);

  for (const name of orderNames) {
    const { data: order } = await supabase
      .from('orders')
      .select('id, order_name, customer_email, raw_shopify_order_data')
      .eq('order_name', name)
      .maybeSingle();

    if (order) {
      const cust = order.raw_shopify_order_data?.customer;
      console.log(`\nOrder ${name}:`);
      console.log(`  Current Email: ${order.customer_email}`);
      if (cust) {
        console.log(`  Shopify Customer: ${cust.first_name} ${cust.last_name} (${cust.email})`);
      } else {
        console.log(`  No Shopify Customer data found.`);
      }
    } else {
      console.log(`\nOrder ${name}: NOT FOUND`);
    }
  }
}

checkSpecificOrders().catch(console.error);

