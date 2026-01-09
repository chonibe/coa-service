const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkWH1182() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('Checking warehouse_orders for order_id 1182 or 14051-1182...');
  const { data, error } = await supabase
    .from('warehouse_orders')
    .select('*')
    .or('order_id.eq.#1182,order_id.eq.1182,order_id.ilike.%1182%');

  if (error) console.error(error);
  else {
    console.log(`Found ${data.length} matches:`);
    data.forEach(d => console.log(`- Order: ${d.order_id}, Email: ${d.ship_email}, Name: ${d.ship_name}`));
  }
}

checkWH1182();

