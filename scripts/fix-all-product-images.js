
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}

const supabase = createClient(url, key);

function isPlaceholder(url) {
  if (!url) return true;
  return url.includes('placehold.co') || url.includes('placeholder.svg') || url.includes('placeholder.jpg');
}

async function repairImages() {
  console.log('🚀 Starting improved global image data repair...');

  // 1. Repair products table (prioritize real Shopify URLs)
  console.log('\n--- Repairing products table ---');
  
  const { data: products, error: pError } = await supabase
    .from('products')
    .select('id, image_url, img_url');

  if (pError) {
    console.error('Error fetching products:', pError);
  } else {
    let pUpdated = 0;
    for (const p of products) {
      const imgPlaceholder = isPlaceholder(p.img_url);
      const imagePlaceholder = isPlaceholder(p.image_url);
      
      let bestUrl = null;
      if (!imagePlaceholder) bestUrl = p.image_url;
      else if (!imgPlaceholder) bestUrl = p.img_url;
      
      if (bestUrl && (imgPlaceholder || imagePlaceholder || p.img_url !== p.image_url)) {
        const { error: uError } = await supabase
          .from('products')
          .update({
            image_url: bestUrl,
            img_url: bestUrl
          })
          .eq('id', p.id);
          
        if (!uError) pUpdated++;
      }
    }
    console.log(`✅ Updated ${pUpdated} products with better image URLs.`);
  }

  // 2. Repair order_line_items_v2 table
  console.log('\n--- Repairing order_line_items_v2 table ---');
  
  const { data: latestProducts } = await supabase.from('products').select('product_id, img_url, image_url');
  const imageMap = new Map();
  latestProducts?.forEach(p => {
    const img = p.image_url || p.img_url;
    if (img && !isPlaceholder(img)) {
      const pId = p.product_id?.toString();
      if (pId) imageMap.set(pId, img);
    }
  });

  const { data: items, error: iError } = await supabase
    .from('order_line_items_v2')
    .select('id, product_id, img_url')
    .not('product_id', 'is', null);

  if (iError) {
    console.error('Error fetching line items:', iError);
  } else {
    let iUpdated = 0;
    for (const item of items) {
      const bestImg = imageMap.get(item.product_id?.toString());
      if (bestImg && (isPlaceholder(item.img_url) || item.img_url !== bestImg)) {
        const { error: uiError } = await supabase
          .from('order_line_items_v2')
          .update({ img_url: bestImg })
          .eq('id', item.id);
        
        if (!uiError) iUpdated++;
      }
    }
    console.log(`✅ Updated ${iUpdated} line items with real images from products table.`);
  }

  console.log('\n🎉 Image repair complete!');
}

repairImages().catch(console.error);
