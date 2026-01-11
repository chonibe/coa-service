
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function findMissingProducts() {
  console.log('--- Finding line items with missing products ---');
  
  const { data: items, error } = await supabase
    .from('order_line_items_v2')
    .select('product_id, name')
    .not('product_id', 'is', null);

  if (error) {
    console.error(error);
    return;
  }

  const uniqueProductIds = [...new Set(items.map(i => i.product_id))];
  console.log(`Found ${uniqueProductIds.length} unique product IDs in line items.`);

  const { data: products } = await supabase
    .from('products')
    .select('product_id');

  const existingProductIds = new Set(products?.map(p => p.product_id));
  
  const missingIds = uniqueProductIds.filter(id => !existingProductIds.has(id));
  
  console.log(`Found ${missingIds.length} product IDs missing from products table.`);
  
  if (missingIds.length > 0) {
    console.log('Sample missing IDs:', missingIds.slice(0, 5));
    
    // Check some names for these missing products
    const sampleNames = items.filter(i => missingIds.includes(i.product_id)).slice(0, 5).map(i => i.name);
    console.log('Sample missing product names:', sampleNames);
  }
}

findMissingProducts();

