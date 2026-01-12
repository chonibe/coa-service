const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function syncImages() {
  const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
  const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  console.log('🚀 Syncing latest images from Shopify...');

  let allProducts = [];
  let nextCursor = null;

  try {
    // 1. Fetch products from Shopify
    do {
      let url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products.json?limit=250`;
      if (nextCursor) url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products.json?limit=250&page_info=${nextCursor}`;

      const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
      const data = await res.json();
      const products = data.products || [];
      allProducts = allProducts.concat(products);

      nextCursor = null;
      const link = res.headers.get('link');
      if (link && link.includes('rel="next"')) {
        const match = link.match(/page_info=([^&>]+)/);
        if (match) nextCursor = match[1];
      }
      console.log(`Fetched ${allProducts.length} products...`);
    } while (nextCursor);

    const productImgMap = new Map();
    console.log('Updating products table...');
    
    // Process in batches of 50 for Supabase
    for (let i = 0; i < allProducts.length; i += 50) {
      const batch = allProducts.slice(i, i + 50);
      const upserts = batch.map(p => {
        const img = p.image?.src || (p.images && p.images[0]?.src) || null;
        productImgMap.set(p.id.toString(), img);
        
        // Include mandatory fields
        const price = p.variants && p.variants[0] ? parseFloat(p.variants[0].price) : 0;
        
        return {
          product_id: p.id,
          name: p.title,
          handle: p.handle,
          vendor_name: p.vendor,
          description: p.body_html || '',
          price: price,
          img_url: img,
          image_url: img,
          updated_at: new Date().toISOString()
        };
      });

      const { error } = await supabase.from('products').upsert(upserts, { onConflict: 'product_id' });
      if (error) console.error(`Error in batch ${i}:`, error.message);
    }

    // 2. Update line items
    console.log('Updating line items...');
    const { data: items } = await supabase.from('order_line_items_v2').select('id, product_id, img_url');
    let updatedCount = 0;
    
    for (const item of items) {
      if (!item.product_id) continue;
      const latestImg = productImgMap.get(item.product_id.toString());
      if (latestImg && latestImg !== item.img_url) {
        const { error } = await supabase.from('order_line_items_v2').update({ img_url: latestImg }).eq('id', item.id);
        if (!error) updatedCount++;
      }
    }

    console.log(`✅ Done. Updated images for ${updatedCount} line items.`);
  } catch (e) {
    console.error('Failed:', e.message);
  }
}

syncImages();
