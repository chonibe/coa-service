const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkSchema() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Products Schema Sample ---');
  const { data: products, error: pError } = await supabase
    .from('products')
    .select('*')
    .limit(1);
  
  if (pError) console.error(pError);
  else console.log(Object.keys(products[0]));

  console.log('\n--- Line Items Schema Sample ---');
  const { data: lineItems, error: lError } = await supabase
    .from('order_line_items_v2')
    .select('*')
    .limit(1);
  
  console.log('\n--- Raw Shopify Line Items for Order #1331 ---');
  const { data: raw1331 } = await supabase
    .from('orders')
    .select('raw_shopify_order_data')
    .eq('id', '12547767796098')
    .single();
  console.log(JSON.stringify(raw1331?.raw_shopify_order_data?.line_items, null, 2));
}

checkSchema();
