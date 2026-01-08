const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function analyzeData() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('--- Analyzing Data Enrichment Potential ---');
  
  // 1. Check orders table
  const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const { count: ordersWithEmail } = await supabase.from('orders').select('*', { count: 'exact', head: true }).not('customer_email', 'is', null);
  
  console.log(`Total Orders in DB: ${totalOrders}`);
  console.log(`Orders with customer_email: ${ordersWithEmail}`);
  console.log(`Orders MISSING email: ${totalOrders - ordersWithEmail}`);

  // 2. Check warehouse potential
  const { data: warehouseSamples } = await supabase.from('warehouse_orders').select('order_id, shopify_order_id, ship_email, ship_name').limit(1000);
  console.log(`Total Warehouse records fetched: ${warehouseSamples.length}`);

  // 3. Try to match missing emails
  if (totalOrders - ordersWithEmail > 0) {
    const { data: missingOrders } = await supabase.from('orders').select('id, order_number, order_name').is('customer_email', null).limit(100);
    
    let matchesFound = 0;
    for (const order of missingOrders) {
      // Match by order_name (e.g. #1234) or id
      const match = warehouseSamples.find(w => w.order_id === order.order_name || w.shopify_order_id === order.id);
      if (match && match.ship_email) {
        matchesFound++;
      }
    }
    console.log(`Potential matches found in warehouse for missing emails: ${matchesFound} (out of ${missingOrders.length} checked)`);
  }

  // 4. Check display names
  const { count: profilesCount } = await supabase.from('collector_profiles').select('*', { count: 'exact', head: true });
  console.log(`Total manual collector profiles: ${profilesCount}`);
}

analyzeData();

