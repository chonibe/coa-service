const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkEnrichment() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('--- Enrichment Status ---');

  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  const { count: enrichedOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .not('customer_email', 'is', null);

  const { count: nullOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .is('customer_email', null);

  console.log(`Total Orders: ${totalOrders}`);
  console.log(`Enriched (has email): ${enrichedOrders}`);
  console.log(`Missing Email: ${nullOrders}`);

  if (nullOrders > 0) {
    console.log('\nSample orders missing email:');
    const { data: samples } = await supabase
      .from('orders')
      .select('id, order_name, created_at')
      .is('customer_email', null)
      .limit(5);
    console.table(samples);
  }

  const { count: totalWarehouse } = await supabase
    .from('warehouse_orders')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\nTotal Warehouse Records: ${totalWarehouse}`);
}

checkEnrichment();

