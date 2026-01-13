require('dotenv').config();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;

async function checkVariants(productId) {
  const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products/${productId}/variants.json`;
  const response = await fetch(url, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
  const data = await response.json();
  
  for (const v of data.variants) {
    const mfUrl = `https://${SHOPIFY_SHOP}/admin/api/2024-01/variants/${v.id}/metafields.json`;
    const mfResponse = await fetch(mfUrl, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
    const mfData = await mfResponse.json();
    console.log(`Variant: ${v.title} (${v.id})`, mfData.metafields);
  }
}

const pid = process.argv[2] || '8651571855587';
checkVariants(pid);
