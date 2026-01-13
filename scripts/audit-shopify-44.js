require('dotenv').config();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;

async function checkAllMetafields() {
  const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products.json?limit=250`;
  const response = await fetch(url, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
  const data = await response.json();
  const products = data.products;

  console.log(`Checking ${products.length} products for '44' in metafields...`);

  for (const p of products) {
    const mfUrl = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products/${p.id}/metafields.json`;
    const mfResponse = await fetch(mfUrl, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
    const mfData = await mfResponse.json();
    
    const has44 = mfData.metafields.some(mf => mf.value == 44 || mf.value == '44');
    if (has44) {
      const editionSizeMf = mfData.metafields.find(mf => mf.key.includes('edition') || mf.key.includes('volume'));
      console.log(`Product: ${p.title} (ID: ${p.id}) has a metafield with value 44.`);
      if (editionSizeMf) {
        console.log(`  Relevant Metafield: ${editionSizeMf.namespace}.${editionSizeMf.key} = ${editionSizeMf.value}`);
      }
    }
  }
}
checkAllMetafields();
