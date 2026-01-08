const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function syncShopifyCustomers() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const shopifyShopMatch = envContent.match(/SHOPIFY_SHOP=["']?(.*?)["']?(\r|\n|$)/);
  const shopifyTokenMatch = envContent.match(/SHOPIFY_ACCESS_TOKEN=["']?(.*?)["']?(\r|\n|$)/);

  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const SHOPIFY_SHOP = shopifyShopMatch[1].trim();
  const SHOPIFY_ACCESS_TOKEN = shopifyTokenMatch[1].trim();

  const supabase = createClient(url, key);

  console.log('🚀 Starting Shopify Customer Sync...');

  let nextUrl = `https://${SHOPIFY_SHOP}/admin/api/2024-01/customers.json?limit=250`;
  let totalSynced = 0;

  while (nextUrl) {
    console.log(`Fetching from: ${nextUrl}`);
    const response = await fetch(nextUrl, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch: ${response.status} ${errorText}`);
      break;
    }

    const data = await response.json();
    const customers = data.customers || [];
    
    if (customers.length === 0) break;

    const customersToUpsert = customers.map(c => ({
      shopify_customer_id: String(c.id),
      email: c.email?.toLowerCase() || null,
      first_name: c.first_name || null,
      last_name: c.last_name || null,
      phone: c.phone || null,
      created_at: c.created_at,
      updated_at: c.updated_at,
      raw_data: c,
    }));

    const { error: upsertError } = await supabase
      .from('shopify_customers')
      .upsert(customersToUpsert, { onConflict: 'shopify_customer_id' });

    if (upsertError) {
      console.error('Error upserting customers:', upsertError);
    } else {
      totalSynced += customers.length;
      console.log(`✅ Synced ${customers.length} customers (Total: ${totalSynced})`);
    }

    // Handle pagination
    const linkHeader = response.headers.get("link");
    if (linkHeader) {
      const match = linkHeader.match(/<([^>]+)>; rel="next"/);
      nextUrl = match ? match[1] : null;
    } else {
      nextUrl = null;
    }
  }

  console.log(`\n🎉 Shopify Customer Sync complete! Total: ${totalSynced}`);
}

syncShopifyCustomers();

