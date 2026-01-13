require('dotenv').config();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;

async function check(productId) {
  const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products/${productId}.json`;
  const response = await fetch(url, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
  const data = await response.json();
  const text = JSON.stringify(data);
  
  console.log(`Checking ${productId}...`);
  if (text.includes('44')) {
    console.log('Found 44 in product JSON!');
    // Find where it is
    for (const [key, value] of Object.entries(data.product)) {
      if (JSON.stringify(value).includes('44')) {
        console.log(`  -> in key: ${key}`);
      }
    }
  } else {
    console.log('Did not find 44 in product JSON.');
  }

  // Check metafields too
  const mfUrl = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products/${productId}/metafields.json`;
  const mfResponse = await fetch(mfUrl, { headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } });
  const mfData = await mfResponse.json();
  const mfText = JSON.stringify(mfData);
  
  if (mfText.includes('44')) {
    console.log('Found 44 in metafields JSON!');
    mfData.metafields.forEach(mf => {
      if (JSON.stringify(mf.value).includes('44')) {
        console.log(`  -> ${mf.namespace}.${mf.key} = ${mf.value}`);
      }
    });
  } else {
    console.log('Did not find 44 in metafields JSON.');
  }
}

const pid = process.argv[2] || '8651571855587';
check(pid);
