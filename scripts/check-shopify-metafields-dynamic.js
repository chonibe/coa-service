require('dotenv').config();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;

async function checkMetafields(productId) {
  const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products/${productId}/metafields.json`;
  
  console.log(`Fetching: ${url}`);
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    console.error(`Error: ${response.status}`);
    return;
  }

  const data = await response.json();
  console.log(`Metafields for product ${productId}:`, JSON.stringify(data.metafields, null, 2));
}

const pid = process.argv[2] || '8589059227875';
checkMetafields(pid);
