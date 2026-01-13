require('dotenv').config();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;

async function checkProduct(productId) {
  const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products/${productId}.json`;
  const response = await fetch(url, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
  const data = await response.json();
  console.log(JSON.stringify(data.product, null, 2));
}

const pid = process.argv[2] || '8651571855587';
checkProduct(pid);
