const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkPendingEnrichment() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('Checking for matchable but unenriched orders...');
  
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_name')
    .is('customer_email', null);
  
  console.log(`Orders missing email: ${orders.length}`);
  
  const { data: warehouse } = await supabase
    .from('warehouse_orders')
    .select('order_id, ship_email')
    .not('ship_email', 'is', null);
  
  const warehouseMap = new Map(warehouse.map(w => [w.order_id.toLowerCase(), w.ship_email]));
  
  const matchable = orders.filter(o => warehouseMap.has(o.order_name.toLowerCase()));
  
  console.log(`Matchable orders: ${matchable.length}`);
  if (matchable.length > 0) {
    console.log('Example:', matchable[0].order_name, '->', warehouseMap.get(matchable[0].order_name.toLowerCase()));
  }
}

checkPendingEnrichment();

