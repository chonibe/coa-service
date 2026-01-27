const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function enrichPIIByOrderId() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('🚀 Starting PII Enrichment by Order ID...');

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
  } else {
    console.warn('⚠️ CSV file not found.');
  }

  // 2. Fetch Warehouse Orders from DB
  const { data: warehouseOrders, error: whError } = await supabase
    .from('warehouse_orders')
    .select('order_id, shopify_order_id, ship_email, ship_name, ship_phone');

  if (whError) {
    console.error('❌ Error fetching warehouse orders:', whError.message);
    return;
  }
  console.log(`✅ Fetched ${warehouseOrders.length} warehouse records.`);

  // 3. Map PII by Order Name (#1234) and Shopify ID
  const piiMap = new Map(); // Key: Order Name or Shopify ID

  // Add CSV data to map
  csvRecords.forEach(r => {
    const orderName = r['Name'];
    const shopifyId = r['Id'];
    const email = r['Email']?.toLowerCase().trim();
    const name = r['Billing Name'] || r['Shipping Name'];
    const phone = r['Phone'] || r['Billing Phone'] || r['Shipping Phone'];

    const data = { email, name, phone };
    if (orderName) piiMap.set(orderName, data);
    if (shopifyId) piiMap.set(shopifyId, data);
  });

  // Add/Enrich with Warehouse data (Warehouse is often more accurate for shipping)
  warehouseOrders.forEach(w => {
    const data = {
      email: w.ship_email?.toLowerCase().trim(),
      name: w.ship_name,
      phone: w.ship_phone
    };
    
    const updateMap = (key) => {
      const existing = piiMap.get(key) || {};
      piiMap.set(key, {
        email: data.email || existing.email,
        name: data.name || existing.name,
        phone: data.phone || existing.phone
      });
    };

    if (w.order_id) updateMap(w.order_id);
    if (w.shopify_order_id) updateMap(w.shopify_order_id);
  });

  // 4. Fetch all orders from database
  const { data: dbOrders, error: ordError } = await supabase
    .from('orders')
    .select('id, order_name, customer_email, customer_name, customer_phone, customer_id');

  if (ordError) {
    console.error('❌ Error fetching orders:', ordError.message);
    return;
  }

  console.log(`🔄 Processing ${dbOrders.length} orders...`);

  let ordersEnriched = 0;
  let profilesCreated = 0;

  for (const order of dbOrders) {
    // Try to find PII using Order Name or Shopify ID
    const bestPii = piiMap.get(order.order_name) || piiMap.get(order.id);

    if (bestPii && (bestPii.email || bestPii.name)) {
      const email = bestPii.email || order.customer_email;
      const name = bestPii.name || order.customer_name;
      const phone = bestPii.phone || order.customer_phone;

      const needsUpdate = 
        (email && email !== order.customer_email) || 
        (name && name !== order.customer_name && name !== 'null') ||
        (phone && phone !== order.customer_phone);

      if (needsUpdate) {
        console.log(`📍 Enriching ${order.order_name}: Email="${email}", Name="${name}"`);
        
        await supabase
          .from('orders')
          .update({
            customer_email: email,
            customer_name: name,
            customer_phone: phone,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);
        
        ordersEnriched++;

        // 5. Ensure Collector Profile exists for this email
        if (email && email !== '' && email !== 'null') {
          // Check for existing profile by email OR shopify_customer_id
          let existingProfile = null;
          
          const { data: profileByEmail } = await supabase
            .from('collector_profiles')
            .select('id, shopify_customer_id')
            .eq('email', email)
            .maybeSingle();

          existingProfile = profileByEmail;

          // Also check by Shopify customer ID if we have one
          if (!existingProfile && order.customer_id) {
            const { data: profileByShopifyId } = await supabase
              .from('collector_profiles')
              .select('id, email')
              .eq('shopify_customer_id', order.customer_id)
              .maybeSingle();

            if (profileByShopifyId) {
              console.log(`   🔗 Found existing profile by Shopify ID: ${profileByShopifyId.email}`);
              existingProfile = profileByShopifyId;
              
              // Update the profile with the new email if different
              if (profileByShopifyId.email !== email) {
                console.log(`   📝 Updating profile email from ${profileByShopifyId.email} to ${email}`);
                await supabase
                  .from('collector_profiles')
                  .update({ 
                    email,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', profileByShopifyId.id);
              }
            }
          }

          if (!existingProfile) {
            console.log(`   ✨ Creating profile for ${email}`);
            const parts = (name || '').split(' ');
            const firstName = parts[0] || 'Guest';
            const lastName = parts.slice(1).join(' ') || 'Collector';

            await supabase
              .from('collector_profiles')
              .insert({
                email,
                first_name: firstName,
                last_name: lastName,
                phone: phone,
                shopify_customer_id: order.customer_id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            profilesCreated++;
          } else if (existingProfile && !existingProfile.shopify_customer_id && order.customer_id) {
            // Update existing profile with Shopify ID if it doesn't have one
            console.log(`   🔗 Adding Shopify ID to existing profile: ${email}`);
            await supabase
              .from('collector_profiles')
              .update({ 
                shopify_customer_id: order.customer_id,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingProfile.id);
          }
        }
      }
    }
  }

  console.log(`\n🎉 Enrichment Complete!`);
  console.log(`- Orders enriched: ${ordersEnriched}`);
  console.log(`- New profiles created: ${profilesCreated}`);
}

enrichPIIByOrderId().catch(err => console.error('Enrichment failed:', err));

