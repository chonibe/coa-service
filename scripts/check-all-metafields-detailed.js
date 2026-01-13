require('dotenv').config();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;

async function check() {
  const productId = '8651571855587';
  const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products/${productId}/metafields.json`;
  const response = await fetch(url, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
  const data = await response.json();
  
  console.log('--- ALL METAFIELDS FOR 8651571855587 ---');
  data.metafields.forEach(mf => {
    console.log(`${mf.namespace}.${mf.key} = ${mf.value} (Type: ${mf.type})`);
  });
}
check();
