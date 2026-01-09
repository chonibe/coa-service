const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function syncAllImages() {
  console.log('🚀 Starting global product image synchronization...');

  // 1. Fetch all products with images
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('product_id, img_url, name');

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return;
  }

  // Create an image map
  const imageMap = new Map();
  products.forEach(p => {
    if (p.img_url) {
      imageMap.set(p.product_id.toString(), p.img_url);
    }
  });

  console.log(`Loaded ${imageMap.size} product images from products table.`);

  // 2. Fetch all line items missing images but having a product_id
  const { data: items, error: itemsError } = await supabase
    .from('order_line_items_v2')
    .select('id, product_id, img_url')
    .is('img_url', null)
    .not('product_id', 'is', null);

  if (itemsError) {
    console.error('Error fetching items:', itemsError);
    return;
  }

  console.log(`Found ${items.length} line items missing images.`);

  let updatedCount = 0;
  for (const item of items) {
    const img = imageMap.get(item.product_id.toString());
    if (img) {
      const { error: updateError } = await supabase
        .from('order_line_items_v2')
        .update({ img_url: img })
        .eq('id', item.id);

      if (!updateError) updatedCount++;
    }
  }

  console.log(`\n🎉 Image synchronization complete! Updated ${updatedCount} line items with product images.`);
}

syncAllImages();

