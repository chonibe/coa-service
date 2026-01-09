const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function searchProducts(pattern) {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log(`--- Searching for "${pattern}" ---`);
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${pattern}%,sku.ilike.%${pattern}%`);
  
  if (error) {
    console.error(error);
    return;
  }

  console.log(JSON.stringify(products, null, 2));
}

const pattern = process.argv[2] || 'Lilith';
searchProducts(pattern);

