const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = "https://ldmppmnpgdxueebkkpid.supabase.co";
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) ||
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('🔍 Checking for missing Shopify orders for chonibe@gmail.com...\n');

  // The user ID for chonibe@gmail.com
  const userId = 'b2f58223-0131-4d53-9aa8-c003e1955033';

  try {
    // Check if there are any orders that should be linked to this user
    console.log('1. Checking all orders for email chonibe@gmail.com...');
    const { data: allOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', 'chonibe@gmail.com');

    console.log(`Found ${allOrders?.length || 0} orders with this email`);

    // Check if the warehouse order "100" has a corresponding Shopify order
    console.log('\n2. Checking warehouse order "100"...');
    const { data: warehouseOrder } = await supabase
      .from('warehouse_orders')
      .select('*')
      .eq('order_id', '100')
      .single();

    if (warehouseOrder) {
      console.log('Warehouse order found:', warehouseOrder);

      // Check if there's a Shopify order with this ID or order_name
      const { data: shopifyOrder } = await supabase
        .from('orders')
        .select('*')
        .or(`id.eq."100",order_name.eq."#100"`)
        .single();

      if (shopifyOrder) {
        console.log('✅ Matching Shopify order found:', shopifyOrder);
      } else {
        console.log('❌ No matching Shopify order found');

        // Let's check if we can find any recent orders that might match
        console.log('\n3. Checking recent orders...');
        const { data: recentOrders } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        console.log('Recent orders:');
        recentOrders?.forEach(order => {
          console.log(`  - ${order.order_number}: ${order.customer_email} (${order.customer_id})`);
        });
      }
    }

    // Let's create a collector profile for this user manually
    console.log('\n4. Creating collector profile for user...');
    const { data: existingProfile } = await supabase
      .from('collector_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from('collector_profiles')
        .insert({
          user_id: userId,
          email: 'chonibe@gmail.com',
          first_name: null,
          last_name: null,
          phone: null,
          bio: null,
          avatar_url: null,
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      } else {
        console.log('✅ Collector profile created');
      }
    } else {
      console.log('Profile already exists');
    }

    // Now let's manually create a test order and line item for this user
    console.log('\n5. Creating test data...');

    // Create a test order
    const testOrderId = `test-${Date.now()}`;
    const { error: orderError } = await supabase
      .from('orders')
      .upsert({
        id: testOrderId,
        order_number: '99999',
        order_name: '#99999',
        processed_at: new Date().toISOString(),
        financial_status: 'paid',
        fulfillment_status: 'fulfilled',
        total_price: 50.00,
        currency_code: 'USD',
        customer_email: 'chonibe@gmail.com',
        customer_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        archived: false,
        raw_shopify_order_data: {
          customer: {
            id: userId,
            email: 'chonibe@gmail.com',
            first_name: 'Test',
            last_name: 'User'
          }
        }
      });

    if (orderError) {
      console.error('Error creating test order:', orderError);
    } else {
      console.log('✅ Test order created');

      // Create a test line item
      const { error: itemError } = await supabase
        .from('order_line_items_v2')
        .insert({
          line_item_id: `test-${Date.now()}`,
          order_id: testOrderId,
          order_name: '#99999',
          name: 'Test Artwork',
          edition_number: 1,
          edition_total: 100,
          product_id: 'test-product-123',
          status: 'active',
          owner_email: 'chonibe@gmail.com',
          owner_name: 'Test User',
          owner_id: userId,
          customer_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (itemError) {
        console.error('Error creating test line item:', itemError);
      } else {
        console.log('✅ Test line item created');

        // Run edition assignment
        console.log('\n6. Running edition assignment...');
        const { data: assignmentResult } = await supabase.rpc('assign_edition_numbers', {
          p_product_id: 'test-product-123'
        });
        console.log(`Edition assignment result: ${assignmentResult} items updated`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

run();

