require('dotenv').config();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;

async function checkCollections() {
  const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/custom_collections.json`;
  const response = await fetch(url, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
  const data = await response.json();
  
  for (const c of data.custom_collections) {
    const mfUrl = `https://${SHOPIFY_SHOP}/admin/api/2024-01/collections/${c.id}/metafields.json`;
    const mfResponse = await fetch(mfUrl, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
    const mfData = await mfResponse.json();
    console.log(`Collection: ${c.title}`, mfData.metafields);
  }
}
checkCollections();
