const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function debugBittmannOrders() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const email = 'bittmannroma@gmail.com';

  console.log(`Checking ALL orders for ${email}...`);
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_name, customer_email, customer_name, processed_at')
    .ilike('customer_email', email);

  if (error) console.error(error);
  else {
    console.log(`Found ${orders.length} orders for ${email}:`);
    orders.forEach(o => console.log(`- ${o.order_name} (${o.id}), Name: ${o.customer_name}, Date: ${o.processed_at}`));
  }

  console.log(`\nChecking for "Philip Bittmann" by name...`);
  const { data: byName, error: nameError } = await supabase
    .from('orders')
    .select('id, order_name, customer_email, customer_name')
    .ilike('customer_name', '%Philip Bittmann%');

  if (nameError) console.error(nameError);
  else {
    console.log(`Found ${byName.length} orders matching name:`);
    byName.forEach(o => console.log(`- ${o.order_name}, Email: ${o.customer_email}`));
  }
}

debugBittmannOrders();

