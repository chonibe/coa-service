require('dotenv').config();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;

async function checkVariantMetafield() {
  const metafieldId = '183965024642';
  const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/metafields/${metafieldId}.json`;

  console.log('Checking metafield:', metafieldId);
  const response = await fetch(url, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
  const data = await response.json();

  console.log('Metafield details:', JSON.stringify(data, null, 2));
}
checkVariantMetafield();