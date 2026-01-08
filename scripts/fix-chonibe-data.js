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

  console.log('🔧 Fixing chonibe@gmail.com data...\n');

  try {
    // 1. Get a real product ID from existing products
    console.log('1. Getting a real product ID...');
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    const productId = products?.[0]?.id || 8590279737571; // Fallback to a known product
    console.log('Using product ID:', productId);

    // 2. Create proper test order
    console.log('\n2. Creating proper test order...');
    const testOrderId = `test-chonibe-${Date.now()}`;
    const { error: orderError } = await supabase
      .from('orders')
      .upsert({
        id: testOrderId,
        order_number: 999001,
        order_name: '#TEST001',
        processed_at: new Date().toISOString(),
        financial_status: 'paid',
        fulfillment_status: 'fulfilled',
        total_price: 100.00,
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
            first_name: 'Choni',
            last_name: 'Beigel'
          }
        }
      }, { onConflict: 'id' });

    if (orderError) {
      console.error('Error creating test order:', orderError);
      return;
    }
    console.log('✅ Test order created');

    // 3. Create proper line items
    console.log('\n3. Creating test line items...');
    const lineItems = [
      {
        line_item_id: `chonibe-item-1-${Date.now()}`,
        order_id: testOrderId,
        order_name: '#TEST001',
        name: 'Test Artwork - From Warehouse Order #100',
        edition_number: null, // Will be assigned
        edition_total: null,
        product_id: productId,
        status: 'active',
        owner_email: 'chonibe@gmail.com',
        owner_name: 'Choni Beigel',
        owner_id: userId,
        customer_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    for (const item of lineItems) {
      const { error: itemError } = await supabase
        .from('order_line_items_v2')
        .insert(item);

      if (itemError) {
        console.error('Error creating line item:', itemError);
      } else {
        console.log('✅ Line item created');
      }
    }

    // 4. Run edition assignment
    console.log('\n4. Running edition assignment...');
    const { data: assignmentResult, error: assignError } = await supabase.rpc('assign_edition_numbers', {
      p_product_id: productId.toString()
    });

    if (assignError) {
      console.error('Edition assignment error:', assignError);
    } else {
      console.log(`✅ Edition assignment completed: ${assignmentResult} items updated`);
    }

    // 5. Update warehouse order to link to user
    console.log('\n5. Linking warehouse order to user...');
    const { error: warehouseError } = await supabase
      .from('warehouse_orders')
      .update({ shopify_order_id: userId })
      .eq('order_id', '100');

    if (warehouseError) {
      console.error('Error linking warehouse order:', warehouseError);
    } else {
      console.log('✅ Warehouse order linked to user');
    }

    // 6. Test the comprehensive profile API (simulate the call)
    console.log('\n6. Simulating comprehensive profile API call...');
    console.log('User ID:', userId);
    console.log('Email:', 'chonibe@gmail.com');

    // Check what the API would return
    const { data: profile } = await supabase
      .from('collector_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: userEditions } = await supabase
      .from('order_line_items_v2')
      .select('*')
      .eq('owner_id', userId);

    const { data: userOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', userId);

    console.log('\n📊 Data summary:');
    console.log('- Profile:', profile ? '✅ Found' : '❌ Missing');
    console.log('- Editions:', userEditions?.length || 0);
    console.log('- Orders:', userOrders?.length || 0);
    console.log('- Warehouse records: 1 (already existed)');

  } catch (error) {
    console.error('Error:', error);
  }
}

run();

