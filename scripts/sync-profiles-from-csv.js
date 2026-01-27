const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function syncProfilesOnly() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const csvPath = 'c:\\Users\\choni\\Downloads\\orders_export_1 (13).csv';
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  console.log(`Loaded ${records.length} records from CSV.`);

  // Map unique order names to contact info
  const orderMap = new Map();
  records.forEach(r => {
    const orderName = r['Name'];
    if (!orderName) return;

    if (!orderMap.has(orderName)) {
      const email = r['Email']?.toLowerCase().trim() || null;
      const name = r['Billing Name'] || r['Shipping Name'] || '';
      const phone = r['Phone'] || r['Billing Phone'] || r['Shipping Phone'] || null;

      orderMap.set(orderName, {
        email,
        name,
        phone,
        shopifyId: r['Id']
      });
    }
  });

  console.log(`Identified ${orderMap.size} unique orders for sync.`);

  let ordersUpdated = 0;
  let profilesCreated = 0;

  for (const [orderName, data] of orderMap.entries()) {
    const { email, name, phone, shopifyId } = data;

    // 1. If email exists, ensure a Collector Profile exists
    if (email && email !== 'null' && email !== '') {
      let existingProfile = null;
      
      // Check by email first
      const { data: profileByEmail } = await supabase
        .from('collector_profiles')
        .select('id, shopify_customer_id')
        .eq('email', email)
        .maybeSingle();

      existingProfile = profileByEmail;

      // Get shopify_customer_id from order if available
      let shopifyCustomerId = null;
      const { data: orderData } = await supabase
        .from('orders')
        .select('customer_id')
        .or(`id.eq.${shopifyId},order_name.eq.${orderName}`)
        .maybeSingle();
      
      shopifyCustomerId = orderData?.customer_id || null;

      // Check by shopify_customer_id if we have one and no profile by email
      if (!existingProfile && shopifyCustomerId) {
        const { data: profileByShopifyId } = await supabase
          .from('collector_profiles')
          .select('id, email')
          .eq('shopify_customer_id', shopifyCustomerId)
          .maybeSingle();

        if (profileByShopifyId) {
          console.log(`  Found existing profile by Shopify ID: ${profileByShopifyId.email}`);
          existingProfile = profileByShopifyId;
          
          // Update email if different
          if (profileByShopifyId.email !== email) {
            await supabase
              .from('collector_profiles')
              .update({ email, updated_at: new Date().toISOString() })
              .eq('id', profileByShopifyId.id);
          }
        }
      }

      if (!existingProfile) {
        console.log(`Creating profile for ${email}...`);
        const parts = name.split(' ');
        const firstName = parts[0] || 'Guest';
        const lastName = parts.slice(1).join(' ') || 'Collector';

        const { error: insertError } = await supabase
          .from('collector_profiles')
          .insert({
            email,
            first_name: firstName,
            last_name: lastName,
            phone,
            shopify_customer_id: shopifyCustomerId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error(`  Error creating profile: ${insertError.message}`);
          if (insertError.code === '23505') {
            console.log(`    Duplicate prevented by database constraint`);
          }
        } else {
          profilesCreated++;
        }
      } else if (existingProfile && !existingProfile.shopify_customer_id && shopifyCustomerId) {
        // Add shopify_customer_id to existing profile if it doesn't have one
        await supabase
          .from('collector_profiles')
          .update({ 
            shopify_customer_id: shopifyCustomerId,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProfile.id);
      }
    }

    // 2. Pair Order with the contact details (regardless of whether an email exists)
    // We try to find the order by Shopify ID first, then by Order Name
    const { data: dbOrder } = await supabase
      .from('orders')
      .select('id, customer_email, customer_name')
      .or(`id.eq.${shopifyId},order_name.eq.${orderName}`)
      .maybeSingle();

    if (dbOrder) {
      // Update the order with the CSV contact info
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          customer_email: email,
          customer_name: name || dbOrder.customer_name, // Keep existing name if CSV name is empty
          customer_phone: phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', dbOrder.id);
      
      if (updateError) {
        console.error(`  Error updating order ${orderName}: ${updateError.message}`);
      } else {
        ordersUpdated++;
      }
    }
  }

  console.log(`\nSync complete!`);
  console.log(`- Profiles created: ${profilesCreated}`);
  console.log(`- Orders updated/paired: ${ordersUpdated}`);
}

syncProfilesOnly().catch(err => console.error('Script failed:', err));

