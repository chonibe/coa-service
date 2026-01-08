const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function fullSync() {
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

  console.log('🚀 Starting FULL Historical Shopify Sync...');

  let nextUrl = `https://${SHOPIFY_SHOP}/admin/api/2024-01/orders.json?status=any&limit=250`;
  let processedCount = 0;

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
    const orders = data.orders || [];
    
    if (orders.length === 0) break;

    const ordersToUpsert = orders.map(order => ({
      id: String(order.id),
      order_number: String(order.order_number),
      order_name: order.name,
      processed_at: order.processed_at || order.created_at,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      total_price: order.current_total_price ? parseFloat(order.current_total_price) : null,
      currency_code: order.currency,
      customer_email: order.email?.toLowerCase() || null,
      updated_at: order.updated_at,
      customer_id: order.customer?.id || null,
      shopify_id: String(order.id),
      subtotal_price: order.subtotal_price ? parseFloat(order.subtotal_price) : null,
      total_tax: order.total_tax ? parseFloat(order.total_tax) : null,
      customer_reference: order.checkout_token || order.cart_token || null,
      raw_shopify_order_data: order,
      created_at: order.created_at,
      cancelled_at: order.cancelled_at || null,
      archived: order.closed_at !== null || order.cancel_reason !== null || (order.tags && order.tags.toLowerCase().includes('archived')),
      shopify_order_status: order.status || null,
    }));

    const { error: upsertError } = await supabase
      .from('orders')
      .upsert(ordersToUpsert, { onConflict: 'id' });

    if (upsertError) {
      console.error('Error upserting orders:', upsertError);
    } else {
      processedCount += orders.length;
      console.log(`✅ Processed ${orders.length} orders (Total: ${processedCount})`);
    }

    // Handle line items for these orders
    for (const order of orders) {
      if (order.line_items && order.line_items.length > 0) {
        const v2LineItems = order.line_items.map(li => ({
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
          price: parseFloat(li.price),
          fulfillment_status: li.fulfillment_status,
          status: order.cancelled_at ? "inactive" : "active",
          created_at: order.created_at,
          updated_at: new Date().toISOString(),
          owner_email: order.email?.toLowerCase() || null,
          customer_id: order.customer?.id ? String(order.customer.id) : null,
        }));

        await supabase.from('order_line_items_v2').upsert(v2LineItems, { onConflict: 'line_item_id' });
      }
    }

    // Check for next page
    const linkHeader = response.headers.get("link");
    if (linkHeader) {
      const match = linkHeader.match(/<([^>]+)>; rel="next"/);
      nextUrl = match ? match[1] : null;
    } else {
      nextUrl = null;
    }
  }

  console.log(`\n🎉 Full sync complete! Processed ${processedCount} orders.`);
  
  // Final enrichment step: Pull PII from warehouse for any orders missing emails
  console.log('🌉 Running PII enrichment for missing emails...');
  const { data: missingOrders } = await supabase
    .from('orders')
    .select('id, order_name')
    .is('customer_email', null);
  
  if (missingOrders && missingOrders.length > 0) {
    let reconciled = 0;
    for (const order of missingOrders) {
      const { data: matched } = await supabase
        .from('warehouse_orders')
        .select('ship_email')
        .or(`order_id.eq."${order.order_name}",shopify_order_id.eq."${order.id}"`)
        .not('ship_email', 'is', null)
        .maybeSingle();
      
      if (matched) {
        await supabase.from('orders').update({ customer_email: matched.ship_email.toLowerCase() }).eq('id', order.id);
        reconciled++;
      }
    }
    console.log(`Reconciled ${reconciled} orders from warehouse data.`);
  }
}

fullSync();

