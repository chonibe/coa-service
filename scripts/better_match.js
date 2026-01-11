
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function betterMatch() {
  console.log('--- Attempting fuzzy match for Choni\'s items ---');
  
  const { data: items } = await supabase
    .from('order_line_items_v2')
    .select('id, name, sku')
    .ilike('owner_email', 'chonibe@gmail.com');

  const { data: products } = await supabase
    .from('products')
    .select('product_id, name, sku, img_url');

  for (const item of items) {
    console.log(`\nItem: "${item.name}" | SKU: ${item.sku}`);
    
    // Try matching by SKU
    let match = products.find(p => p.sku && item.sku && p.sku.toLowerCase().trim() === item.sku.toLowerCase().trim());
    if (match) {
      console.log(`  ✅ Matched by SKU! Product: "${match.name}" | img_url: ${match.img_url}`);
      continue;
    }

    // Try matching by Name
    match = products.find(p => p.name && item.name && p.name.toLowerCase().trim() === item.name.toLowerCase().trim());
    if (match) {
      console.log(`  ✅ Matched by Name! Product: "${match.name}" | img_url: ${match.img_url}`);
      continue;
    }

    console.log(`  ❌ No match found.`);
  }
}

betterMatch();

