const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = "https://ldmppmnpgdxueebkkpid.supabase.co";
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) ||
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const userId = 'b2f58223-0131-4d53-9aa8-c003e1955033';

  console.log('🔍 Debugging API query for chonibe@gmail.com...\n');

  try {
    // Test the exact query from the comprehensive API
    console.log('1. Testing editions query...');
    const { data: editions, error: editionsError } = await supabase
      .from('order_line_items_v2')
      .select(`
        id, line_item_id, order_id, name, edition_number, edition_total, status,
        owner_name, owner_email, created_at, nfc_tag_id, nfc_claimed_at,
        certificate_url, orders (order_number, processed_at, financial_status, fulfillment_status),
        products (edition_size, img_url, vendor_name)
      `)
      .eq('owner_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (editionsError) {
      console.error('Editions query error:', editionsError);
    } else {
      console.log(`✅ Found ${editions?.length || 0} editions with joins`);
      if (editions && editions.length > 0) {
        editions.forEach(edition => {
          console.log(`  - ${edition.name} (#${edition.edition_number})`);
          console.log(`    Orders join: ${edition.orders ? '✅' : '❌'}`);
          console.log(`    Products join: ${edition.products ? '✅' : '❌'}`);
        });
      }
    }

    // Test orders query
    console.log('\n2. Testing orders query...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id, order_number, order_name, processed_at, financial_status, fulfillment_status,
        total_price, currency_code, customer_email, customer_id, created_at, cancelled_at, archived,
        raw_shopify_order_data,
        order_line_items_v2 (id, name, edition_number, edition_total, status, owner_id)
      `)
      .or(`customer_id.eq."${userId}",customer_email.eq."chonibe@gmail.com"`)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Orders query error:', ordersError);
    } else {
      console.log(`✅ Found ${orders?.length || 0} orders with line items`);
      if (orders && orders.length > 0) {
        orders.forEach(order => {
          console.log(`  - Order #${order.order_number} (${order.customer_email})`);
          console.log(`    Line items: ${order.order_line_items_v2?.length || 0}`);
        });
      }
    }

    // Test warehouse query
    console.log('\n3. Testing warehouse query...');
    const { data: warehouse, error: warehouseError } = await supabase
      .from('warehouse_orders')
      .select('*')
      .eq('shopify_order_id', userId)
      .or(`ship_email.eq."chonibe@gmail.com"`);

    if (warehouseError) {
      console.error('Warehouse query error:', warehouseError);
    } else {
      console.log(`✅ Found ${warehouse?.length || 0} warehouse records`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

run();

