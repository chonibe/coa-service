const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function findLinked() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('Searching for warehouse records with shopify_order_id...');
  const { data, error } = await supabase
    .from('warehouse_orders')
    .select('order_id, shopify_order_id, ship_email')
    .not('shopify_order_id', 'is', null)
    .limit(10);
    
  if (error) console.error(error);
  else console.table(data);
}

findLinked();

