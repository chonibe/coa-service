const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function syncShopifyProductsToDb() {
  const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
  const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('🚀 Starting Shopify Product Sync...');

  let allShopifyProducts = [];
  let nextCursor = null;
  let pageCount = 0;

  try {
    // 1. Fetch all products from Shopify
    do {
      pageCount++;
      let url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products.json?limit=250`;
      
      if (nextCursor) {
        url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products.json?limit=250&page_info=${nextCursor}`;
      }

      console.log(`📄 Fetching Shopify page ${pageCount}: ${url}`);
      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`❌ Shopify Error: ${response.status}`, errText);
        throw new Error(`Shopify API error: ${response.status}`);
      }

      const data = await response.json();
      const products = data.products || [];
      allShopifyProducts = allShopifyProducts.concat(products);
      console.log(`   Found ${products.length} products on this page.`);

      nextCursor = null;
      const linkHeader = response.headers.get('link') || response.headers.get('Link');
      if (linkHeader) {
        console.log(`   Link header: ${linkHeader}`);
        const links = linkHeader.split(',');
        for (const link of links) {
          const [u, rel] = link.split(';');
          if (rel.includes('rel="next"')) {
            const match = u.match(/page_info=([^&>]+)/);
            if (match) {
              nextCursor = match[1];
              console.log(`   Next page cursor: ${nextCursor}`);
            }
          }
        }
      }
    } while (nextCursor);

    console.log(`✅ Fetched ${allShopifyProducts.length} products from Shopify.`);

    // 2. Update Supabase products table
    let updatedProducts = 0;
    const productImages = new Map();

    for (const sp of allShopifyProducts) {
      const imgUrl = sp.image?.src || (sp.images && sp.images[0]?.src) || null;
      productImages.set(sp.id.toString(), imgUrl);

      const price = sp.variants && sp.variants[0] ? parseFloat(sp.variants[0].price) : 0;

      const upsertData = {
        product_id: sp.id,
        name: sp.title,
        handle: sp.handle,
        vendor_name: sp.vendor,
        description: sp.body_html || '',
        price: price,
        image_url: imgUrl,
        img_url: imgUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('products')
        .upsert(upsertData, { onConflict: 'product_id' });

      if (error) {
        console.error(`❌ Error upserting product ${sp.id}:`, error.message);
      } else {
        updatedProducts++;
      }
    }

    console.log(`✅ Updated ${updatedProducts} products in Supabase.`);

    // 3. Update order_line_items_v2 with latest images
    console.log('🔄 Propagating image updates to order_line_items_v2...');
    
    // Get all unique product IDs in order_line_items_v2
    const { data: lineItems, error: liError } = await supabase
      .from('order_line_items_v2')
      .select('id, product_id, img_url');

    if (liError) {
      throw new Error(`Error fetching line items: ${liError.message}`);
    }

    let itemsUpdated = 0;
    for (const item of lineItems) {
      if (!item.product_id) continue;
      
      const latestImg = productImages.get(item.product_id.toString());
      if (latestImg && latestImg !== item.img_url) {
        const { error: updateError } = await supabase
          .from('order_line_items_v2')
          .update({ img_url: latestImg })
          .eq('id', item.id);
        
        if (!updateError) itemsUpdated++;
      }
    }

    console.log(`✅ Propagated ${itemsUpdated} image updates to line items.`);
    console.log('🎉 Sync complete!');

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

syncShopifyProductsToDb();

