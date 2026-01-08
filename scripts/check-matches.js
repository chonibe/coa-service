const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkMatches() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('--- Checking for Order -> Warehouse Matches ---');
  
  const { data: warehouse } = await supabase.from('warehouse_orders').select('order_id, ship_email, ship_name').not('order_id', 'is', null);
  const { data: orders } = await supabase.from('orders').select('id, order_name, customer_email');
  
  let matches = 0;
  let updateData = [];

  for (const order of orders) {
    // Match by #1234
    const match = warehouse.find(w => w.order_id === order.order_name);
    if (match) {
      matches++;
      if (!order.customer_email) {
        updateData.push({ id: order.id, email: match.ship_email });
      }
    }
  }

  console.log(`Total Orders: ${orders.length}`);
  console.log(`Matches found in warehouse: ${matches}`);
  console.log(`Orders that can be enriched with missing email: ${updateData.length}`);
  
  if (updateData.length > 0) {
    console.log('\nSample Enrichment:');
    console.log(`Order ID: ${updateData[0].id}, New Email: ${updateData[0].email}`);
  }
}

checkMatches();

