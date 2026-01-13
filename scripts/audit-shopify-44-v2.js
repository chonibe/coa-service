require('dotenv').config();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;

async function auditAllMetafields() {
  const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products.json?limit=250`;
  const response = await fetch(url, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
  const data = await response.json();
  const products = data.products;

  console.log(`Auditing ${products.length} products...`);

  for (const p of products) {
    try {
      const mfUrl = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products/${p.id}/metafields.json`;
      const mfResponse = await fetch(mfUrl, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
      const mfData = await mfResponse.json();
      
      if (!mfData.metafields) continue;

      const matched = mfData.metafields.filter(mf => mf.value == 44 || mf.value == '44');
      if (matched.length > 0) {
        console.log(`[MATCH] Product: ${p.title} (ID: ${p.id})`);
        matched.forEach(m => {
          console.log(`   -> ${m.namespace}.${m.key} = ${m.value}`);
        });
      }
    } catch (e) {
      console.error(`Error auditing ${p.id}:`, e.message);
    }
  }
}
auditAllMetafields();
