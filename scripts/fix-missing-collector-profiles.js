const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function fixCollectorProfiles() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  // 1. Load CSV
  const csvPath = 'c:\\Users\\choni\\Downloads\\orders_export_1 (13).csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  console.log(`Loaded ${records.length} records from CSV.`);

  // Create a map of order name (#1234) to customer data
  const csvMap = new Map();
  records.forEach(r => {
    const orderName = r['Name'];
    if (orderName && r['Email']) {
      // Use the first record found for an order name (Shopify export has multiple lines per order)
      if (!csvMap.has(orderName)) {
        csvMap.set(orderName, {
          email: r['Email'].toLowerCase().trim(),
          name: r['Billing Name'] || r['Shipping Name'] || null,
          phone: r['Phone'] || r['Billing Phone'] || r['Shipping Phone'] || null,
          shopify_id: r['Id']
        });
      }
    }
  });

  console.log(`Unique orders in CSV: ${csvMap.size}`);

  // 2. Fetch orders with missing emails
  const { data: dbOrders, error } = await supabase
    .from('orders')
    .select('id, order_name, customer_email, customer_name')
    .or('customer_email.is.null,customer_email.eq.""');

  if (error) {
    console.error('Error fetching orders:', error);
    return;
  }

  console.log(`Found ${dbOrders.length} orders in DB with missing emails.`);

  let updatedCount = 0;
  let profilesCreated = 0;

  for (const dbOrder of dbOrders) {
    const csvData = csvMap.get(dbOrder.order_name);
    if (csvData) {
      console.log(`Updating ${dbOrder.order_name} with email: ${csvData.email}`);
      
      // Update order
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          customer_email: csvData.email,
          customer_name: csvData.name,
          customer_phone: csvData.phone
        })
        .eq('id', dbOrder.id);

      if (updateError) {
        console.error(`  Error updating order ${dbOrder.order_name}:`, updateError.message);
      } else {
        updatedCount++;
      }

      // Also ensure a collector profile exists for this email
      const { data: profile } = await supabase
        .from('collector_profiles')
        .select('id')
        .eq('email', csvData.email)
        .maybeSingle();

      if (!profile) {
        console.log(`  Creating profile for ${csvData.email}`);
        const parts = (csvData.name || '').split(' ');
        const first_name = parts[0] || 'Guest';
        const last_name = parts.slice(1).join(' ') || 'Collector';

        const { error: profileError } = await supabase
          .from('collector_profiles')
          .insert({
            email: csvData.email,
            first_name,
            last_name,
            phone: csvData.phone,
            shopify_customer_id: null, // We don't have the Shopify Customer ID, just the Order ID
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error(`  Error creating profile for ${csvData.email}:`, profileError.message);
        } else {
          profilesCreated++;
        }
      }
    }
  }

  console.log(`\nDone!`);
  console.log(`Orders updated: ${updatedCount}`);
  console.log(`Collector profiles created: ${profilesCreated}`);
}

fixCollectorProfiles();

