require('dotenv').config();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;

async function globalSearch44() {
  console.log(`Global Search for 44 in ${SHOPIFY_SHOP}...`);
  const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products.json?limit=250`;
  const response = await fetch(url, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
  const data = await response.json();
  
  for (const p of data.products) {
    const pStr = JSON.stringify(p);
    if (pStr.includes('44')) {
      // console.log(`[MATCH] Product: ${p.title} (${p.id}) has 44 in core data`);
    }

    const mfUrl = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products/${p.id}/metafields.json`;
    const mfResponse = await fetch(mfUrl, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
    const mfData = await mfResponse.json();
    
    const matchedMfs = mfData.metafields.filter(mf => JSON.stringify(mf).includes('44'));
    if (matchedMfs.length > 0) {
      console.log(`[MATCH MF] Product: ${p.title} (${p.id})`);
      matchedMfs.forEach(m => {
        console.log(`   -> ${m.namespace}.${m.key} = ${m.value}`);
      });
    }
  }
}
globalSearch44();
