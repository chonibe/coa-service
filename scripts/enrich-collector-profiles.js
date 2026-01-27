const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function enrichCollectorProfiles() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const csvPath = 'c:\\Users\\choni\\Downloads\\orders_export_1 (13).csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  console.log(`Loaded ${records.length} line item records from CSV.`);

  // 1. Map Orders to get customer info from CSV
  // The CSV doesn't have Shopify Customer ID directly, but we can get it from our 'orders' table in Supabase
  // using the Order ID or Order Name from the CSV.
  
  const { data: dbOrders } = await supabase.from('orders').select('id, order_name, customer_id');
  const dbOrderMap = new Map();
  dbOrders.forEach(o => {
    dbOrderMap.set(o.id, o.customer_id);
    dbOrderMap.set(o.order_name, o.customer_id);
  });

  // 2. Group unique customers by email
  const customers = new Map();
  for (const r of records) {
    const email = r['Email']?.toLowerCase()?.trim();
    if (!email) continue;

    const orderId = r['Id'];
    const orderName = r['Name'];
    const shopifyCustomerId = dbOrderMap.get(orderId) || dbOrderMap.get(orderName) || null;

    const billingName = r['Billing Name'] || r['Shipping Name'];
    const phone = r['Phone'] || r['Billing Phone'] || r['Shipping Phone'];
    
    let first_name = null;
    let last_name = null;
    if (billingName) {
      const parts = billingName.split(' ');
      first_name = parts[0];
      last_name = parts.slice(1).join(' ') || null;
    }

    if (!customers.has(email)) {
      customers.set(email, {
        email,
        first_name,
        last_name,
        phone: phone || null,
        shopify_customer_id: shopifyCustomerId
      });
    } else {
      const existing = customers.get(email);
      if (!existing.first_name && first_name) existing.first_name = first_name;
      if (!existing.last_name && last_name) existing.last_name = last_name;
      if (!existing.phone && phone) existing.phone = phone;
      if (!existing.shopify_customer_id && shopifyCustomerId) existing.shopify_customer_id = shopifyCustomerId;
    }
  }

  console.log(`Found ${customers.size} unique customers in CSV.`);

  // 3. Fetch existing profiles (by both email and shopify_customer_id)
  const { data: profiles } = await supabase.from('collector_profiles').select('*');
  const profileMap = new Map();
  const profileByShopifyId = new Map();
  
  profiles?.forEach(p => {
    if (p.email) profileMap.set(p.email?.toLowerCase(), p);
    if (p.shopify_customer_id) profileByShopifyId.set(p.shopify_customer_id, p);
  });

  let updates = 0;
  let creations = 0;
  let duplicatesPrevented = 0;

  for (const [email, csvData] of customers) {
    let existingProfile = profileMap.get(email);
    
    // Also check by Shopify customer ID to prevent duplicates
    if (!existingProfile && csvData.shopify_customer_id) {
      const profileByShopify = profileByShopifyId.get(csvData.shopify_customer_id);
      if (profileByShopify) {
        console.log(`⚠️  Found existing profile by Shopify ID for ${email}: ${profileByShopify.email}`);
        existingProfile = profileByShopify;
        duplicatesPrevented++;
      }
    }
    
    const profileData = {
      email: email,
      first_name: csvData.first_name,
      last_name: csvData.last_name,
      phone: csvData.phone,
      shopify_customer_id: csvData.shopify_customer_id,
      updated_at: new Date().toISOString()
    };

    if (existingProfile) {
      // Update
      const { error: upError } = await supabase
        .from('collector_profiles')
        .update(profileData)
        .eq('id', existingProfile.id);
      
      if (upError) console.error(`Error updating profile for ${email}:`, upError);
      else updates++;
    } else {
      // Create new (user_id is NULL)
      const { error: crError } = await supabase
        .from('collector_profiles')
        .insert({
          ...profileData,
          created_at: new Date().toISOString()
        });
      
      if (crError) {
        console.error(`Error creating profile for ${email}:`, crError);
        // Check if it's a unique constraint violation
        if (crError.code === '23505') {
          console.log(`   Duplicate prevented by database constraint`);
          duplicatesPrevented++;
        }
      } else {
        creations++;
      }
    }
  }

  console.log(`Enrichment complete.`);
  console.log(`Profiles updated: ${updates}`);
  console.log(`New profiles created: ${creations}`);
  console.log(`Duplicate profiles prevented: ${duplicatesPrevented}`);
}

enrichCollectorProfiles();
