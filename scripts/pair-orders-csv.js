const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function pairOrdersWithProfiles() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  // 1. Load CSV and build a comprehensive map based on Order Name (#1234)
  const csvPath = 'c:\\Users\\choni\\Downloads\\orders_export_1 (13).csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  console.log(`Loaded ${records.length} records from CSV.`);

  // Create a map of order name to full customer details
  const csvOrderMap = new Map();
  records.forEach(r => {
    const orderName = r['Name'];
    if (orderName) {
      if (!csvOrderMap.has(orderName)) {
        csvOrderMap.set(orderName, {
          email: r['Email']?.toLowerCase().trim() || null,
          billingName: r['Billing Name']?.trim() || null,
          shippingName: r['Shipping Name']?.trim() || null,
          phone: r['Phone'] || r['Billing Phone'] || r['Shipping Phone'] || null,
          billingStreet: r['Billing Street'] || null,
          billingCity: r['Billing City'] || null,
          billingZip: r['Billing Zip'] || null,
          billingCountry: r['Billing Country'] || null,
          shopifyId: r['Id']
        });
      }
    }
  });

  console.log(`Mapped ${csvOrderMap.size} unique orders from CSV.`);

  // 2. Fetch orders in DB that are missing emails or have "null" names
  const { data: dbOrders, error } = await supabase
    .from('orders')
    .select('id, order_name, customer_email, customer_name');

  if (error) {
    console.error('Error fetching orders:', error);
    return;
  }

  let updatedOrdersCount = 0;
  let profilesProcessedCount = 0;

  console.log(`Processing ${dbOrders.length} orders from database...`);

  for (const dbOrder of dbOrders) {
    const csvData = csvOrderMap.get(dbOrder.order_name);
    
    // Only proceed if we have CSV data for this order name
    if (csvData) {
      const needsUpdate = !dbOrder.customer_email || dbOrder.customer_name === 'null' || !dbOrder.customer_name;
      
      if (needsUpdate) {
        const finalName = csvData.billingName || csvData.shippingName || 'Guest Collector';
        const finalEmail = csvData.email;

        console.log(`Updating ${dbOrder.order_name}: Name="${finalName}", Email="${finalEmail}"`);

        // Update the order in the database
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            customer_email: finalEmail,
            customer_name: finalName,
            customer_phone: csvData.phone,
            shipping_address: {
              address1: csvData.billingStreet,
              city: csvData.billingCity,
              zip: csvData.billingZip,
              country: csvData.billingCountry
            }
          })
          .eq('id', dbOrder.id);

        if (updateError) {
          console.error(`  Error updating order ${dbOrder.order_name}:`, updateError.message);
        } else {
          updatedOrdersCount++;
        }

        // 3. Ensure a Collector Profile exists if we have an email
        if (finalEmail) {
          const { data: existingProfile } = await supabase
            .from('collector_profiles')
            .select('id')
            .eq('email', finalEmail)
            .maybeSingle();

          if (!existingProfile) {
            console.log(`  Creating collector profile for: ${finalEmail}`);
            const parts = finalName.split(' ');
            const first_name = parts[0] || 'Guest';
            const last_name = parts.slice(1).join(' ') || 'Collector';

            const { error: profileError } = await supabase
              .from('collector_profiles')
              .insert({
                email: finalEmail,
                first_name,
                last_name,
                phone: csvData.phone,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (profileError) {
              console.error(`  Error creating profile for ${finalEmail}:`, profileError.message);
            } else {
              profilesProcessedCount++;
            }
          }
        }
      }
    }
  }

  console.log(`\nExecution Summary:`);
  console.log(`- Orders updated with CSV data: ${updatedOrdersCount}`);
  console.log(`- New Collector Profiles created: ${profilesProcessedCount}`);
}

pairOrdersWithProfiles().catch(err => console.error('Script failed:', err));

