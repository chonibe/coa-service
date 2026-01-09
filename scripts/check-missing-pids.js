const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkMissingProductIds() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Active Line Items Missing Product ID ---');
  const { data: items, error } = await supabase
    .from('order_line_items_v2')
    .select('line_item_id, sku, name, order_name, status')
    .eq('status', 'active')
    .is('product_id', null);
  
  if (error) {
    console.error(error);
    return;
  }

  console.log(`Found ${items.length} items.`);
  if (items.length > 0) {
    console.log(JSON.stringify(items.slice(0, 10), null, 2));
  }
}

checkMissingProductIds();

