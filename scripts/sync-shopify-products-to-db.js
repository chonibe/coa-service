const { createClient } = require('@supabase/supabase-js');
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

  console.log('🚀 Starting Shopify Product Sync (with Metafields)...');

  let allProducts = [];
  let hasNextPage = true;
  let cursor = null;

  try {
    // 1. Fetch products using GraphQL for bulk metafields
    while (hasNextPage) {
      const query = `
        query($cursor: String) {
          products(first: 50, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              title
              handle
              vendor
              bodyHtml
              featuredImage {
                url
              }
              variants(first: 1) {
                nodes {
                  price
                }
              }
              editionSize: metafield(namespace: "custom", key: "edition_size") {
                value
              }
              verisartVolume: metafield(namespace: "verisart", key: "edition_volume") {
                value
              }
            }
          }
        }
      `;

      const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-04/graphql.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { cursor }
        }),
      });

      if (!response.ok) {
        throw new Error(`Shopify GraphQL Error: ${response.status}`);
      }

      const result = await response.json();
      if (result.errors) {
        console.error('GraphQL Errors:', result.errors);
        throw new Error('GraphQL query failed');
      }

      const pageData = result.data.products;
      allProducts = allProducts.concat(pageData.nodes);
      hasNextPage = pageData.pageInfo.hasNextPage;
      cursor = pageData.pageInfo.endCursor;
      
      console.log(`Fetched ${allProducts.length} products...`);
    }

    console.log(`✅ Fetched total ${allProducts.length} products from Shopify.`);

    // 2. Update Supabase
    let updatedCount = 0;
    const productEditionMap = new Map();

    for (const p of allProducts) {
      const productId = p.id.split('/').pop(); // Convert gid://shopify/Product/123 to 123
      const imgUrl = p.featuredImage?.url || null;
      const price = parseFloat(p.variants.nodes[0]?.price || '0');

      // Prefer custom.edition_size, then check variant if needed, then verisart.edition_volume
      let editionSizeValue = p.editionSize?.value;

      // If no product-level edition_size, check the first variant's metafields via REST API
      if (!editionSizeValue && p.variants?.nodes?.[0]) {
        try {
          const variantId = p.variants.nodes[0].id.split('/').pop();
          const mfUrl = `https://${SHOPIFY_SHOP}/admin/api/2024-01/variants/${variantId}/metafields.json`;
          const mfResponse = await fetch(mfUrl, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
          const mfData = await mfResponse.json();

          const variantEditionSize = mfData.metafields?.find(mf => mf.key === 'edition_size' && mf.namespace === 'custom')?.value;
          if (variantEditionSize) {
            editionSizeValue = variantEditionSize;
          }
        } catch (e) {
          console.log(`Could not check variant metafields for product ${productId}:`, e.message);
        }
      }

      // Final fallback to verisart edition_volume
      if (!editionSizeValue) {
        editionSizeValue = p.verisartVolume?.value || null;
      }
      
      productEditionMap.set(productId, editionSizeValue);

      const upsertData = {
        product_id: productId,
        name: p.title,
        handle: p.handle,
        vendor_name: p.vendor,
        description: p.bodyHtml || '',
        price: price,
        image_url: imgUrl,
        img_url: imgUrl,
        edition_size: editionSizeValue ? editionSizeValue.toString() : null,
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

    console.log(`✅ Updated ${updatedCount} products in database.`);

    // 3. Propagate edition_size to order_line_items_v2
    console.log('🔄 Propagating edition_size updates to order_line_items_v2...');
    
    // Fetch all line items that might need updating
    const { data: lineItems, error: liError } = await supabase
      .from('order_line_items_v2')
      .select('id, product_id, edition_total');

    if (liError) {
      throw new Error(`Error fetching line items: ${liError.message}`);
    }

    let itemsUpdated = 0;
    for (const item of lineItems) {
      if (!item.product_id) continue;
      
      const latestEditionSize = productEditionMap.get(item.product_id.toString());
      if (latestEditionSize) {
        const currentTotal = item.edition_total ? item.edition_total.toString() : null;
        const newTotal = latestEditionSize.toString();
        
        if (currentTotal !== newTotal) {
          console.log(`Updating line item ${item.id} (${item.product_id}): ${currentTotal} -> ${newTotal}`);
          const { error: updateError } = await supabase
            .from('order_line_items_v2')
            .update({ edition_total: parseInt(latestEditionSize) })
            .eq('id', item.id);
          
          if (!updateError) {
            itemsUpdated++;
          } else {
            console.error(`Error updating line item ${item.id}:`, updateError.message);
          }
        }
      }
    }

    console.log(`✅ Propagated ${itemsUpdated} edition_size updates to line items.`);
    console.log('🎉 Sync complete!');

  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

syncShopifyProductsToDb();
