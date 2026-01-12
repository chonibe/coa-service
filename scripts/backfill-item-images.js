const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function backfillImages() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('🚀 Starting image backfill...');

  // 1. Get products with images
  const { data: products } = await supabase
    .from('products')
    .select('shopify_id, image_url, img_url');
  
  const productMap = new Map();
  products?.forEach(p => {
    const url = p.image_url || p.img_url;
    if (url) productMap.set(p.shopify_id.toString(), url);
  });

  console.log(`Found ${productMap.size} products with images.`);

  // 2. Get line items missing images
  const { data: missingItems } = await supabase
    .from('order_line_items_v2')
    .select('id, product_id')
    .is('img_url', null);

  console.log(`Found ${missingItems?.length || 0} line items missing images.`);

  if (!missingItems || missingItems.length === 0) return;

  // 3. Update line items
  let updatedCount = 0;
  for (const item of missingItems) {
    const imgUrl = productMap.get(item.product_id);
    if (imgUrl) {
      const { error } = await supabase
        .from('order_line_items_v2')
        .update({ img_url: imgUrl })
        .eq('id', item.id);
      
      if (!error) updatedCount++;
    }
  }

  console.log(`✅ Successfully backfilled ${updatedCount} images.`);
}

backfillImages();

