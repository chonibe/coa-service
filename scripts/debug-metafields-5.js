require('dotenv').config();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;

async function check() {
  const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products.json?limit=5`;
  const response = await fetch(url, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
  const data = await response.json();
  
  for (const p of data.products) {
    const mfUrl = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products/${p.id}/metafields.json`;
    const mfResponse = await fetch(mfUrl, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
    const mfData = await mfResponse.json();
    console.log(`Product: ${p.title} (${p.id})`);
    
    const relevant = mfData.metafields.filter(mf => 
      mf.key.includes('edition') || 
      mf.key.includes('volume') || 
      mf.key.includes('size') || 
      mf.value == 44 || 
      mf.value == '44'
    );
    console.log(JSON.stringify(relevant, null, 2));
  }
}
check();
