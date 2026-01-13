const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function syncShopifyProductsWithMetafields() {
  const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
  const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('🚀 Starting Shopify Product Sync with Metafields (GraphQL)...');

  let allProducts = [];
  let hasNextPage = true;
  let cursor = null;

  const query = `
    query getProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            legacyResourceId
            title
            handle
            vendor
            bodyHtml
            featuredImage {
              url
            }
            variants(first: 1) {
              edges {
                node {
                  price
                }
              }
            }
            editionSize: metafield(namespace: "custom", key: "edition_size") {
              value
            }
            editionVolume: metafield(namespace: "verisart", key: "edition_volume") {
              value
            }
          }
        }
      }
    }
  `;

  try {
    while (hasNextPage) {
      const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            first: 250,
            after: cursor,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`❌ Shopify GraphQL Error: ${response.status}`, errText);
        throw new Error(`Shopify API error: ${response.status}`);
      }

      const result = await response.json();
      if (result.errors) {
        console.error('❌ GraphQL Errors:', JSON.stringify(result.errors, null, 2));
        throw new Error('GraphQL Errors');
      }

      const data = result.data.products;
      allProducts = allProducts.concat(data.edges.map(e => e.node));
      hasNextPage = data.pageInfo.hasNextPage;
      cursor = data.pageInfo.endCursor;

      console.log(`   Fetched ${allProducts.length} products so far...`);
    }

    console.log(`✅ Fetched total ${allProducts.length} products from Shopify.`);

    let updatedCount = 0;
    const productImages = new Map();

    for (const p of allProducts) {
      const productId = p.legacyResourceId;
      const imgUrl = p.featuredImage?.url || null;
      productImages.set(productId.toString(), imgUrl);

      const price = p.variants.edges[0]?.node?.price ? parseFloat(p.variants.edges[0].node.price) : 0;
      
      // Determine edition size: prioritize custom.edition_size, then verisart.edition_volume
      let editionSize = p.editionSize?.value || p.editionVolume?.value || null;
      
      const upsertData = {
        product_id: productId,
        name: p.title,
        handle: p.handle,
        vendor_name: p.vendor,
        description: p.bodyHtml || '',
        price: price,
        image_url: imgUrl,
        img_url: imgUrl,
        edition_size: editionSize ? editionSize.toString() : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('products')
        .upsert(upsertData, { onConflict: 'product_id' });

      if (error) {
        console.error(`❌ Error upserting product ${productId}:`, error.message);
      } else {
        updatedCount++;
      }
    }

    console.log(`✅ Updated ${updatedCount} products in Supabase.`);

    // 3. Update order_line_items_v2 with latest images and possibly edition_total
    console.log('🔄 Propagating updates to order_line_items_v2...');
    
    // Get all unique product IDs in order_line_items_v2
    const { data: lineItems, error: liError } = await supabase
      .from('order_line_items_v2')
      .select('id, product_id, img_url, edition_total');

    if (liError) {
      throw new Error(`Error fetching line items: ${liError.message}`);
    }

    let itemsUpdated = 0;
    for (const item of lineItems) {
      if (!item.product_id) continue;
      
      const p = allProducts.find(prod => prod.legacyResourceId === item.product_id.toString());
      if (!p) continue;

      const latestImg = p.featuredImage?.url || null;
      const editionSize = p.editionSize?.value || p.editionVolume?.value || null;
      
      const updates = {};
      if (latestImg && latestImg !== item.img_url) {
        updates.img_url = latestImg;
      }
      
      // If edition_total is missing or different, update it
      if (editionSize && (!item.edition_total || item.edition_total.toString() !== editionSize.toString())) {
        updates.edition_total = parseInt(editionSize.toString());
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('order_line_items_v2')
          .update(updates)
          .eq('id', item.id);
        
        if (!updateError) itemsUpdated++;
      }
    }

    console.log(`✅ Propagated ${itemsUpdated} updates to line items.`);
    console.log('🎉 Sync complete!');

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

syncShopifyProductsWithMetafields();
