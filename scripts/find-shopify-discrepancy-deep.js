require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findTheDiscrepancy() {
  const query = `
    {
      products(first: 250) {
        nodes {
          id
          title
          editionSize: metafield(namespace: "custom", key: "edition_size") {
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
    body: JSON.stringify({ query }),
  });

  const result = await response.json();
  const shopifyProducts = result.data.products.nodes;
  
  const { data: dbProducts } = await supabase.from('products').select('product_id, name, edition_size');
  const dbMap = new Map(dbProducts.map(p => [p.product_id.toString(), p]));

  console.log('--- Auditing Discrepancies ---');
  for (const sp of shopifyProducts) {
    const pid = sp.id.split('/').pop();
    const dbProduct = dbMap.get(pid);
    const shopifySize = sp.editionSize?.value;
    
    if (dbProduct && shopifySize && dbProduct.edition_size != shopifySize) {
      console.log(`Discrepancy found for ${sp.title} (ID: ${pid}): DB=${dbProduct.edition_size}, Shopify=${shopifySize}`);
    }
  }
}
findTheDiscrepancy();
