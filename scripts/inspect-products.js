const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function inspectProducts() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Inspecting Products ---');

  const { data: products } = await supabase
    .from('products')
    .select('shopify_id, image_url, img_url, name')
    .limit(5);

  console.log(JSON.stringify(products, null, 2));
}

inspectProducts();

