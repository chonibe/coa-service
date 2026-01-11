
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function globalRepair() {
  console.log('🚀 Starting deep image and product linkage repair...');

  // 1. Fetch all products
  const { data: products } = await supabase
    .from('products')
    .select('id, product_id, name, sku, img_url, image_url');

  const productsByName = new Map();
  const productsBySku = new Map();
  const productsById = new Map();

  products?.forEach(p => {
    const img = p.img_url || p.image_url;
    if (p.product_id) productsById.set(p.product_id.toString(), { ...p, img });
    if (p.sku) productsBySku.set(p.sku.toLowerCase().trim(), { ...p, img });
    if (p.name) productsByName.set(p.name.toLowerCase().trim(), { ...p, img });
  });

  // 2. Fetch all line items missing images
  const { data: items, error: iError } = await supabase
    .from('order_line_items_v2')
    .select('id, product_id, name, sku, img_url');

  if (iError) {
    console.error(iError);
    return;
  }

  console.log(`Processing ${items.length} line items...`);
  let updatedCount = 0;
  let productIdLinked = 0;

  for (const item of items) {
    let match = null;
    
    // Priority 1: Match by product_id
    if (item.product_id) {
      match = productsById.get(item.product_id.toString());
    }
    
    // Priority 2: Match by SKU
    if (!match && item.sku) {
      match = productsBySku.get(item.sku.toLowerCase().trim());
    }
    
    // Priority 3: Match by Name
    if (!match && item.name) {
      match = productsByName.get(item.name.toLowerCase().trim());
    }

    if (match) {
      const updates = {};
      let changed = false;

      // Update image if missing or placeholder
      if (match.img && (!item.img_url || item.img_url.includes('placehold'))) {
        updates.img_url = match.img;
        changed = true;
      }

      // Link product_id if missing
      if (!item.product_id && match.product_id) {
        updates.product_id = match.product_id;
        changed = true;
        productIdLinked++;
      }

      if (changed) {
        const { error: uError } = await supabase
          .from('order_line_items_v2')
          .update(updates)
          .eq('id', item.id);
        
        if (!uError) updatedCount++;
      }
    }
  }

  console.log(`\n✅ Repair complete!`);
  console.log(`Updated ${updatedCount} line items with images/links.`);
  console.log(`Linked ${productIdLinked} missing product_ids.`);
}

globalRepair().catch(console.error);

