require('dotenv').config();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;

async function auditMetafieldsDeep() {
  const query = `
    {
      products(first: 250) {
        nodes {
          id
          title
          metafields(first: 50) {
            nodes {
              namespace
              key
              value
            }
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
  const products = result.data.products.nodes;

  console.log(`Auditing ${products.length} products...`);

  for (const p of products) {
    const editionMfs = p.metafields.nodes.filter(mf => mf.key.includes('edition') || mf.key.includes('volume') || mf.key.includes('size'));
    if (editionMfs.length > 0) {
      const has44 = editionMfs.some(mf => mf.value == 44 || mf.value == '44');
      if (has44) {
        console.log(`[MATCH 44] Product: ${p.title} (ID: ${p.id.split('/').pop()})`);
        editionMfs.forEach(m => {
          console.log(`   -> ${m.namespace}.${m.key} = ${m.value}`);
        });
      }
    }
  }
}
auditMetafieldsDeep();
