const fs = require('fs');

async function countShopifyOrders() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const shopifyShopMatch = envContent.match(/SHOPIFY_SHOP=["']?(.*?)["']?(\r|\n|$)/);
  const shopifyTokenMatch = envContent.match(/SHOPIFY_ACCESS_TOKEN=["']?(.*?)["']?(\r|\n|$)/);

  const SHOPIFY_SHOP = shopifyShopMatch[1].trim();
  const SHOPIFY_ACCESS_TOKEN = shopifyTokenMatch[1].trim();

  console.log(`Checking total order count for ${SHOPIFY_SHOP}...`);

  const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/orders/count.json?status=any`, {
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Error: ${response.status} ${text}`);
    return;
  }

  const data = await response.json();
  console.log(`Total orders in Shopify: ${data.count}`);
}

countShopifyOrders();

