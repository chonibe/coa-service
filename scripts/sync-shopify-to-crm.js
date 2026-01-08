const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function syncShopifyCustomersToCRM() {
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

  console.log('🚀 Syncing ALL Shopify Customers to crm_customers...');

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
    console.log(`Fetched ${customers.length} customers from Shopify.`);
    if (customers.length > 0) {
      console.log('Sample customer fields:', Object.keys(customers[0]));
      console.log('Sample customer email:', customers[0].email);
    }
    
    if (customers.length === 0) break;

    const customersToUpsert = customers.map(c => {
      // Generate a stable UUID from the Shopify ID
      const crypto = require('crypto');
      const hash = crypto.createHash('md5').update('shopify-' + c.id).digest('hex');
      const uuid = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
      
      return {
        id: uuid,
        shopify_customer_id: c.id,
        email: c.email?.toLowerCase() || null,
        first_name: c.first_name || null,
        last_name: c.last_name || null,
        phone: c.phone || null,
        total_orders: c.orders_count || 0,
        total_spent: parseFloat(c.total_spent || '0'),
        created_at: c.created_at,
        updated_at: c.updated_at,
        address: c.default_address || null,
        enrichment_data: { shopify_raw: c }
      };
    }).filter(c => c.email);

    console.log(`Mapping ${customersToUpsert.length} customers with emails.`);

    const { error: upsertError } = await supabase
      .from('crm_customers')
      .upsert(customersToUpsert, { onConflict: 'id' });

    if (upsertError) {
      console.error('Error upserting to CRM:', upsertError);
    } else {
      totalSynced += customersToUpsert.length;
      console.log(`✅ Synced ${customersToUpsert.length} customers (Total: ${totalSynced})`);
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

  console.log(`\n🎉 CRM Customer Sync complete! Total: ${totalSynced}`);
}

syncShopifyCustomersToCRM();

