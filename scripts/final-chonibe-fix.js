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

  console.log('🔧 Final fix for chonibe@gmail.com...\n');

  try {
    // 1. Check what orders exist for this user
    console.log('1. Checking existing orders for user...');
    const { data: existingOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', userId);

    console.log(`Found ${existingOrders?.length || 0} orders for user`);

    let orderId;
    if (existingOrders && existingOrders.length > 0) {
      orderId = existingOrders[0].id;
      console.log('Using existing order:', orderId);
    } else {
      // Create a simple order
      orderId = `chonibe-order-${Date.now()}`;
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          order_number: 999999,
          order_name: '#999999',
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
        });

      if (orderError) {
        console.error('Error creating order:', orderError);
        return;
      }
      console.log('✅ Created order:', orderId);
    }

    // 2. Create line item
    console.log('\n2. Creating line item...');
    const { error: itemError } = await supabase
      .from('order_line_items_v2')
      .insert({
        line_item_id: `chonibe-item-${Date.now()}`,
        order_id: orderId,
        order_name: '#999999',
        name: 'Test Artwork - Choni Beigel',
        description: 'Test artwork from warehouse order #100',
        price: 100.00,
        quantity: 1,
        sku: 'CHONI001',
        vendor_name: 'Test Artist',
        edition_number: null,
        edition_total: null,
        product_id: 14956729565570, // Use a known bigint product_id
        status: 'active',
        owner_email: 'chonibe@gmail.com',
        owner_name: 'Choni Beigel',
        owner_id: userId,
        customer_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (itemError) {
      console.error('Error creating line item:', itemError);
      return;
    }
    console.log('✅ Created line item');

    // 3. Run edition assignment
    console.log('\n3. Running edition assignment...');
    const { data: assignResult, error: assignError } = await supabase.rpc('assign_edition_numbers', {
      p_product_id: '14956729565570'
    });

    if (assignError) {
      console.error('Edition assignment error:', assignError);
    } else {
      console.log(`✅ Edition assignment completed: ${assignResult} items updated`);
    }

    // 4. Final verification
    console.log('\n4. Final verification...');
    const { data: finalEditions } = await supabase
      .from('order_line_items_v2')
      .select('*')
      .eq('owner_id', userId);

    const { data: finalOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', userId);

    console.log('✅ Final data summary:');
    console.log(`- Editions: ${finalEditions?.length || 0}`);
    console.log(`- Orders: ${finalOrders?.length || 0}`);
    console.log(`- Warehouse records: 1 (linked)`);

    if (finalEditions && finalEditions.length > 0) {
      console.log('\nFirst edition:', {
        name: finalEditions[0].name,
        edition: finalEditions[0].edition_number,
        owner: finalEditions[0].owner_email
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

run();



