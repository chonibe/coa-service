const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkOrder1150() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log(`Checking for order 1150...`);
  const { data: orders } = await supabase.from('orders').select('id, order_name, customer_email').ilike('order_name', '%1150%');
  console.log('Orders:', orders);
}

checkOrder1150();

