const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function finalComprehensiveSync() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('🚀 Starting Final Comprehensive PII Sync...');

  // 1. Load Shopify CSV Data
  const csvPath = 'c:\\Users\\choni\\Downloads\\orders_export_1 (13).csv';
  let csvRecords = [];
  if (fs.existsSync(csvPath)) {
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    csvRecords = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true
    });
    console.log(`✅ Loaded ${csvRecords.length} records from CSV.`);
  }

  // 2. Fetch Warehouse Orders
  const { data: warehouseOrders, error: whError } = await supabase
    .from('warehouse_orders')
    .select('order_id, shopify_order_id, ship_email, ship_name, ship_phone');
  
  if (whError) {
    console.error('❌ Error fetching warehouse orders:', whError.message);
    return;
  }
  console.log(`✅ Fetched ${warehouseOrders.length} warehouse records.`);

  // 3. Build Global PII Maps
  const orderPiiMap = new Map(); // Key: order_name or shopify_id
  const emailToProfileMap = new Map(); // Key: email -> { name, phone }

  // A. Process CSV
  csvRecords.forEach(r => {
    const orderName = r['Name'];
    const shopifyId = r['Id'];
    const email = r['Email']?.toLowerCase().trim();
    const name = (r['Billing Name'] || r['Shipping Name'] || '').trim();
    const phone = (r['Phone'] || r['Billing Phone'] || r['Shipping Phone'] || '').trim();

    if (orderName || shopifyId) {
      const pii = { email, name, phone };
      if (orderName) orderPiiMap.set(orderName, pii);
      if (shopifyId) orderPiiMap.set(shopifyId, pii);
      
      if (email && email !== '' && email !== 'null') {
        const existing = emailToProfileMap.get(email) || {};
        emailToProfileMap.set(email, {
          name: name || existing.name,
          phone: phone || existing.phone
        });
      }
    }
  });

  // B. Process Warehouse (Priority for Names/Phones)
  warehouseOrders.forEach(w => {
    const email = w.ship_email?.toLowerCase().trim();
    const name = w.ship_name?.trim();
    const phone = w.ship_phone?.trim();

    if (w.order_id || w.shopify_order_id) {
      const pii = { email, name, phone };
      if (w.order_id) {
        const existing = orderPiiMap.get(w.order_id) || {};
        orderPiiMap.set(w.order_id, {
          email: pii.email || existing.email,
          name: pii.name || existing.name,
          phone: pii.phone || existing.phone
        });
      }
      // Note: Warehouse shopify_order_id might match our order.id
      if (w.shopify_order_id) {
        const existing = orderPiiMap.get(w.shopify_order_id) || {};
        orderPiiMap.set(w.shopify_order_id, {
          email: pii.email || existing.email,
          name: pii.name || existing.name,
          phone: pii.phone || existing.phone
        });
      }

      if (email && email !== '' && email !== 'null') {
        const existing = emailToProfileMap.get(email) || {};
        emailToProfileMap.set(email, {
          name: name || existing.name,
          phone: phone || existing.phone
        });
      }
    }
  });

  // 4. Update Database
  const { data: dbOrders } = await supabase.from('orders').select('id, order_name, customer_email, customer_name, customer_phone');
  
  console.log(`🔄 Syncing ${dbOrders.length} orders...`);
  let ordersUpdated = 0;

  for (const order of dbOrders) {
    const pii = orderPiiMap.get(order.order_name) || orderPiiMap.get(order.id);
    if (pii) {
      const updateData = {};
      if (pii.email && pii.email !== order.customer_email) updateData.customer_email = pii.email;
      if (pii.name && pii.name !== order.customer_name && pii.name !== 'null') updateData.customer_name = pii.name;
      if (pii.phone && pii.phone !== order.customer_phone) updateData.customer_phone = pii.phone;

      if (Object.keys(updateData).length > 0) {
        await supabase.from('orders').update({
          ...updateData,
          updated_at: new Date().toISOString()
        }).eq('id', order.id);
        ordersUpdated++;
      }
    }
  }

  console.log(`🔄 Syncing collector profiles for ${emailToProfileMap.size} unique emails...`);
  let profilesProcessed = 0;

  for (const [email, data] of emailToProfileMap.entries()) {
    const { data: profile } = await supabase.from('collector_profiles').select('id, first_name, last_name, phone').eq('email', email).maybeSingle();
    
    const parts = (data.name || '').split(' ');
    const firstName = parts[0] || 'Guest';
    const lastName = parts.slice(1).join(' ') || 'Collector';

    if (!profile) {
      await supabase.from('collector_profiles').insert({
        email,
        first_name: firstName,
        last_name: lastName,
        phone: data.phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } else {
      // Update name/phone if profile is missing them
      const updateData = {};
      if (!profile.first_name || profile.first_name === 'Guest') updateData.first_name = firstName;
      if (!profile.last_name || profile.last_name === 'Collector') updateData.last_name = lastName;
      if (!profile.phone && data.phone) updateData.phone = data.phone;

      if (Object.keys(updateData).length > 0) {
        await supabase.from('collector_profiles').update({
          ...updateData,
          updated_at: new Date().toISOString()
        }).eq('id', profile.id);
      }
    }
    profilesProcessed++;
  }

  console.log(`\n🎉 Comprehensive Sync Complete!`);
  console.log(`- Orders updated: ${ordersUpdated}`);
  console.log(`- Collector profiles processed: ${profilesProcessed}`);
}

finalComprehensiveSync().catch(console.error);

