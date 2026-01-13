require('dotenv').config();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;

async function audit() {
  const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products.json?limit=250`;
  const response = await fetch(url, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
  const data = await response.json();
  
  console.log(`Checking ${data.products?.length} products...`);

  for (const p of data.products) {
    if (!p.id.toString().startsWith('8')) continue;
    
    const mfUrl = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products/${p.id}/metafields.json`;
    const mfResponse = await fetch(mfUrl, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
    const mfData = await mfResponse.json();
    
    if (!mfData.metafields) continue;

    const has44 = mfData.metafields.some(mf => mf.value == 44 || mf.value == '44');
    if (has44) {
      console.log(`[FOUND 44] ${p.title} (${p.id})`);
      console.log(JSON.stringify(mfData.metafields.filter(mf => mf.value == 44 || mf.value == '44'), null, 2));
    }
  }
}
audit();
