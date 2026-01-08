const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function debugJared() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('--- Debugging Collector: Jared Leto ---');
  
  const { data: wh } = await supabase
    .from('warehouse_orders')
    .select('*')
    .ilike('ship_email', 'crash@jaredleto.com');
    
  console.log('\nWarehouse Records:');
  console.log(JSON.stringify(wh, null, 2));

  if (wh && wh.length > 0) {
    const orderId = wh[0].order_id;
    console.log(`\nSearching for matches for Order ID: ${orderId}`);
    
    const { data: ord } = await supabase
      .from('orders')
      .select('*')
      .or(`order_name.eq."${orderId}",id.eq."${orderId}"`);
      
    console.log('\nMatching Orders in DB:');
    console.table(ord);
  }
}

debugJared();

