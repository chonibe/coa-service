const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = "https://ldmppmnpgdxueebkkpid.supabase.co";
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) ||
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const key = keyMatch[1].trim();
  const s = createClient(url, key);

  console.log('🔍 Checking user chonibe@gmail.com...\n');

  try {
    // 1. Check if user exists
    console.log('1. Checking auth.users...');
    const users = await s.auth.admin.listUsers();
    const user = users.data.users.find(u => u.email === 'chonibe@gmail.com');

    if (!user) {
      console.log('❌ User chonibe@gmail.com not found in auth.users');
      return;
    }

    console.log('✅ User found:', user.id, user.email, user.created_at);

    // 2. Check collector profile
    console.log('\n2. Checking collector_profiles...');
    const { data: profile } = await s
      .from('collector_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      console.log('✅ Collector profile found:', profile);
    } else {
      console.log('⚠️  No collector profile found');
    }

    // 3. Check orders
    console.log('\n3. Checking orders...');
    const { data: orders } = await s
      .from('orders')
      .select('*')
      .or(`customer_email.eq."chonibe@gmail.com",customer_id.eq."${user.id}"`);

    console.log(`Found ${orders?.length || 0} orders`);
    if (orders && orders.length > 0) {
      orders.forEach(order => {
        console.log(`  - Order ${order.order_number}: ${order.customer_email} (${order.customer_id})`);
      });
    }

    // 4. Check line items
    console.log('\n4. Checking order_line_items_v2...');
    const { data: lineItems } = await s
      .from('order_line_items_v2')
      .select('*')
      .or(`owner_email.eq."chonibe@gmail.com",owner_id.eq."${user.id}"`);

    console.log(`Found ${lineItems?.length || 0} line items`);
    if (lineItems && lineItems.length > 0) {
      lineItems.forEach(item => {
        console.log(`  - Item: ${item.name} (Edition: ${item.edition_number}, Owner: ${item.owner_email}, Status: ${item.status})`);
      });
    }

    // 5. Check warehouse data
    console.log('\n5. Checking warehouse_orders...');
    const { data: warehouse } = await s
      .from('warehouse_orders')
      .select('*')
      .eq('ship_email', 'chonibe@gmail.com');

    console.log(`Found ${warehouse?.length || 0} warehouse records`);
    if (warehouse && warehouse.length > 0) {
      warehouse.forEach(record => {
        console.log(`  - Warehouse: ${record.order_id} (${record.ship_email})`);
      });
    }

    // 6. Test the comprehensive profile API
    console.log('\n6. Testing comprehensive profile API...');
    const response = await fetch('http://localhost:3000/api/collector/profile/comprehensive', {
      headers: {
        // We can't simulate auth easily, so let's just check if the API is accessible
      }
    });
    console.log('API response status:', response.status);

  } catch (error) {
    console.error('Error:', error);
  }
}

run();


