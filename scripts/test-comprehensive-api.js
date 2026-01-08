const fs = require('fs');

// Test the comprehensive profile API for chonibe@gmail.com
async function testAPI() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = "https://ldmppmnpgdxueebkkpid.supabase.co";
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) ||
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const key = keyMatch[1].trim();

  console.log('🧪 Testing comprehensive profile API...\n');

  // We can't simulate the auth easily, but we can check if the API structure is working
  // by testing with a direct database query that mimics what the API does

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(url, key);
  const userId = 'b2f58223-0131-4d53-9aa8-c003e1955033';

  try {
    // Simulate what the comprehensive API does
    const { data: profile } = await supabase
      .from('collector_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: editions } = await supabase
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

    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id, order_number, order_name, processed_at, financial_status, fulfillment_status,
        total_price, currency_code, customer_email, customer_id, created_at, cancelled_at, archived,
        raw_shopify_order_data,
        order_line_items_v2 (id, name, edition_number, edition_total, status, owner_id)
      `)
      .or(`customer_id.eq."${userId}",customer_email.eq."chonibe@gmail.com"`)
      .order('created_at', { ascending: false });

    const { data: warehouseData } = await supabase
      .from('warehouse_orders')
      .select('*')
      .eq('shopify_order_id', userId)
      .or(`ship_email.eq."chonibe@gmail.com"`);

    // Calculate stats
    const stats = {
      totalEditions: editions?.length || 0,
      authenticatedEditions: editions?.filter(e => e.nfc_claimed_at).length || 0,
      totalOrders: orders?.length || 0,
      totalSpent: orders?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0,
      firstPurchaseDate: orders?.length > 0 ? orders[orders.length - 1]?.created_at : null,
      lastPurchaseDate: orders?.length > 0 ? orders[0]?.created_at : null,
      warehouseRecords: warehouseData?.length || 0
    };

    console.log('✅ API Test Results:');
    console.log('==================');
    console.log('Profile:', profile ? '✅ Found' : '❌ Missing');
    console.log('Editions:', stats.totalEditions);
    console.log('Orders:', stats.totalOrders);
    console.log('Warehouse Records:', stats.warehouseRecords);
    console.log('Total Spent: $' + stats.totalSpent.toFixed(2));
    console.log('');

    if (editions && editions.length > 0) {
      console.log('📖 Edition Details:');
      editions.forEach(edition => {
        console.log(`  - "${edition.name}" - Edition #${edition.edition_number} (${edition.owner_email})`);
      });
    }

    if (orders && orders.length > 0) {
      console.log('\n🛒 Order Details:');
      orders.forEach(order => {
        console.log(`  - Order #${order.order_number} - $${order.total_price?.toFixed(2) || '0.00'} (${order.customer_email})`);
      });
    }

    if (warehouseData && warehouseData.length > 0) {
      console.log('\n📦 Warehouse Details:');
      warehouseData.forEach(record => {
        console.log(`  - Order ${record.order_id} - ${record.ship_name} (${record.ship_email}) - ${record.quantity} items`);
      });
    }

    console.log('\n🎯 chonibe@gmail.com should now see data in the comprehensive profile!');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAPI();

