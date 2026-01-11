
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function searchProducts() {
  const names = ["Name a Street", "Girl - Print", "Abstract Skull"];
  console.log(`--- Searching for products with names: ${names.join(', ')} ---`);
  
  const { data: products, error } = await supabase
    .from('products')
    .select('product_id, name, img_url, sku')
    .in('name', names);

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Found ${products?.length || 0} matching products.`);
  products?.forEach(p => {
    console.log(`Product: ${p.name} | SKU: ${p.sku} | product_id: ${p.product_id} | img_url: ${p.img_url}`);
  });
}

searchProducts();

