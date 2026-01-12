const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkStreetCollectorProducts() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const { data: products } = await supabase
    .from('products')
    .select('name, edition_size, product_id')
    .eq('vendor_name', 'Street Collector');

  console.log('Street Collector Products:');
  console.log(JSON.stringify(products, null, 2));
}

checkStreetCollectorProducts();

