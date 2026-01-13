require('dotenv').config();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;

async function checkVariantMetafieldsGraphQL() {
  const productId = '8651571855587';
  const query = `
    {
      product(id: "gid://shopify/Product/${productId}") {
        variants(first: 5) {
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
  console.log('Variant Metafields:', JSON.stringify(result.data.product.variants.nodes, null, 2));
}
checkVariantMetafieldsGraphQL();
