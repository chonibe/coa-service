require('dotenv').config();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;

async function audit() {
  console.log(`Auditing ${SHOPIFY_SHOP}...`);
  const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products.json?limit=250`;
  const response = await fetch(url, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
  const data = await response.json();
  
  if (!data.products) return console.log('No products found', data);

  for (const p of data.products) {
    const mfUrl = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products/${p.id}/metafields.json`;
    const mfResponse = await fetch(mfUrl, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
    const mfData = await mfResponse.json();
    
    if (!mfData.metafields) continue;

    const ed = mfData.metafields.find(m => m.key === 'edition_size');
    const vol = mfData.metafields.find(m => m.key === 'edition_volume');
    
    const edVal = ed ? ed.value : 'N/A';
    const volVal = vol ? vol.value : 'N/A';

    if (edVal == 44 || volVal == 44) {
      console.log(`[FOUND 44] ${p.title} (${p.id}) - edition_size: ${edVal}, edition_volume: ${volVal}`);
    } else if (edVal == 90 || volVal == 90) {
      console.log(`[STILL 90] ${p.title} (${p.id}) - edition_size: ${edVal}, edition_volume: ${volVal}`);
    }
  }
}
audit();
