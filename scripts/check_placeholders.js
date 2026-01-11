
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

function isPlaceholder(url) {
  if (!url) return true;
  return url.includes('placehold.co') || url.includes('placeholder.svg') || url.includes('placeholder.jpg');
}

async function checkPlaceholders() {
  console.log('--- Checking line items that still have placeholders ---');
  
  const { data: items, error } = await supabase
    .from('order_line_items_v2')
    .select('id, name, img_url, product_id')
    .not('product_id', 'is', null)
    .limit(10);

  if (error) {
    console.error(error);
    return;
  }

  for (const item of items) {
    if (isPlaceholder(item.img_url)) {
      console.log(`Item "${item.name}" (ID: ${item.id}) has placeholder: ${item.img_url}`);
      
      // Check its product
      const { data: product } = await supabase
        .from('products')
        .select('name, img_url, image_url')
        .eq('product_id', item.product_id)
        .maybeSingle();
        
      if (product) {
        console.log(`  Product "${product.name}" image data: img_url=${product.img_url}, image_url=${product.image_url}`);
      } else {
        console.log(`  No product found for product_id: ${item.product_id}`);
      }
    }
  }
}

checkPlaceholders();

