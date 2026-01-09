const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkRecentShopify() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Recent Shopify Orders ---');
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_name, source, processed_at')
    .eq('source', 'shopify')
    .order('processed_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error(error);
    return;
  }

  console.log(JSON.stringify(orders, null, 2));
}

checkRecentShopify();

