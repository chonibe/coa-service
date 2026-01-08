const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function findOrphans() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('--- Finding Warehouse Orders without Shopify Links ---');
  
  // 1. Get all warehouse orders
  const { data: wh } = await supabase.from('warehouse_orders').select('id, order_id, shopify_order_id, ship_email, ship_name');
  
  // 2. Get all shopify orders (names and IDs)
  const { data: ord } = await supabase.from('orders').select('id, order_name');
  const ordIds = new Set(ord.map(o => o.id));
  const ordNames = new Set(ord.map(o => o.order_name));

  const orphans = wh.filter(w => {
    // Linked if shopify_order_id matches an order ID
    if (w.shopify_order_id && ordIds.has(w.shopify_order_id)) return false;
    // Linked if order_id matches an order name (e.g. #1234)
    if (w.order_id && ordNames.has(w.order_id)) return false;
    return true;
  });

  console.log(`Total Warehouse Orders: ${wh.length}`);
  console.log(`Potential Manual/Orphan Orders: ${orphans.length}`);
  
  if (orphans.length > 0) {
    console.log('\nSample Orphans:');
    console.table(orphans.slice(0, 10));
  }
}

findOrphans();

