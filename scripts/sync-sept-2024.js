const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function syncFromSept2024() {
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

  console.log('🚀 Syncing orders from September 2024 onwards...');

  const startDate = "2024-09-01T00:00:00Z";
  let nextUrl = `https://${SHOPIFY_SHOP}/admin/api/2024-01/orders.json?status=any&created_at_min=${startDate}&limit=250`;
  let totalOrders = 0;

  while (nextUrl) {
    console.log(`Fetching: ${nextUrl}`);
    const response = await fetch(nextUrl, {
      headers: { "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN, "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.error(`Failed: ${response.status}`);
      break;
    }

    const data = await response.json();
    const orders = data.orders || [];
    if (orders.length === 0) break;

    const ordersToUpsert = orders.map(order => ({
      id: String(order.id),
      order_number: parseInt(String(order.order_number), 10),
      order_name: order.name,
      processed_at: order.processed_at || order.created_at,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      total_price: order.current_total_price ? parseFloat(order.current_total_price) : 0,
      currency_code: order.currency || 'USD',
      customer_email: order.email?.toLowerCase() || null,
      updated_at: order.updated_at,
      customer_id: order.customer?.id ? String(order.customer.id) : null,
      shopify_id: String(order.id),
      subtotal_price: order.subtotal_price ? parseFloat(order.subtotal_price) : null,
      total_tax: order.total_tax ? parseFloat(order.total_tax) : null,
      customer_reference: order.checkout_token || order.cart_token || null,
      raw_shopify_order_data: order,
      created_at: order.created_at,
      cancelled_at: order.cancelled_at || null,
      archived: !!(order.closed_at || order.cancel_reason || (order.tags && order.tags.toLowerCase().includes('archived'))),
      shopify_order_status: order.status || null,
    }));

    await supabase.from('orders').upsert(ordersToUpsert, { onConflict: 'id' });
    totalOrders += orders.length;

    for (const order of orders) {
      if (order.line_items) {
        const lineItems = order.line_items.map(li => ({
          line_item_id: String(li.id),
          order_id: String(order.id),
          order_name: order.name,
          product_id: String(li.product_id),
          variant_id: String(li.variant_id),
          name: li.title,
          description: li.title,
          sku: li.sku || null,
          vendor_name: li.vendor,
          quantity: li.quantity,
          price: parseFloat(li.price || '0'),
          fulfillment_status: li.fulfillment_status,
          status: order.cancelled_at ? "inactive" : "active",
          created_at: order.created_at,
          updated_at: new Date().toISOString(),
          owner_email: order.email?.toLowerCase() || null,
          customer_id: order.customer?.id ? String(order.customer.id) : null,
        }));
        await supabase.from('order_line_items_v2').upsert(lineItems, { onConflict: 'line_item_id' });
      }
    }

    const linkHeader = response.headers.get("link");
    nextUrl = linkHeader?.match(/<([^>]+)>; rel="next"/) ? linkHeader.match(/<([^>]+)>; rel="next"/)[1] : null;
  }

  console.log(`✅ Synced ${totalOrders} Shopify orders.`);
}

syncFromSept2024();

