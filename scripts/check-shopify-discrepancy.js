require('dotenv').config();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;

async function checkDiscrepancy() {
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
  const products = result.data.products.nodes;
  
  const discrepancies = products.filter(p => p.editionSize?.value === '44' || p.editionSize?.value === 44);
  
  console.log('Products with edition_size 44 in Shopify:');
  discrepancies.forEach(p => {
    console.log(`- ${p.title} (ID: ${p.id.split('/').pop()}) = ${p.editionSize.value}`);
  });
}
checkDiscrepancy();
