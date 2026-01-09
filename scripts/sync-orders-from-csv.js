const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Simple CSV parser for Shopify export
function parseShopifyCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const headers = lines[0].split(',');
  
  const nameIdx = headers.indexOf('Name');
  const emailIdx = headers.indexOf('Email');
  const currencyIdx = headers.indexOf('Currency');
  const totalIdx = headers.indexOf('Total');
  const discountIdx = headers.indexOf('Discount Amount');

  const orders = [];
  // Skip header, process lines
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    
    // Very basic split - might fail on commas in names, but usually Shopify Names/Emails don't have them
    // A better way would be a regex that respects quotes
    const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    
    if (row[nameIdx] && row[emailIdx]) {
      orders.push({
        name: row[nameIdx].trim(),
        email: row[emailIdx].trim().toLowerCase(),
        currency: row[currencyIdx]?.trim(),
        total: parseFloat(row[totalIdx]) || 0,
        discount: parseFloat(row[discountIdx]) || 0
      });
    }
  }
  return orders;
}

async function syncFromCSV() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  
  if (!urlMatch || !keyMatch) {
    console.error('Could not find Supabase URL or Service Role Key in .env');
    return;
  }
  
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const csvPath = 'c:/Users/choni/Downloads/orders_export_1 (12).csv';
  console.log(`Parsing CSV at ${csvPath}...`);
  const csvOrders = parseShopifyCSV(csvPath);
  console.log(`Found ${csvOrders.length} orders in CSV.`);

  // Get current Kickstarter backers for matching
  const { data: backers } = await supabase
    .from('kickstarter_backers_list')
    .select('*');
  const backerMap = new Map(backers.map(b => [b.email.toLowerCase(), b]));

  let updatedCount = 0;
  let linkedCount = 0;

  for (const csvOrder of csvOrders) {
    // 1. Find order in Supabase
    const { data: dbOrder } = await supabase
      .from('orders')
      .select('id, customer_email, kickstarter_backing_amount_gbp')
      .eq('order_name', csvOrder.name)
      .maybeSingle();

    if (dbOrder) {
      const updates = {};
      
      // Update email if missing or mismatch
      if (!dbOrder.customer_email || dbOrder.customer_email.toLowerCase() !== csvOrder.email) {
        updates.customer_email = csvOrder.email;
        linkedCount++;
      }

      // If this email is a known Kickstarter backer, ensure fields are set
      const backerInfo = backerMap.get(csvOrder.email);
      if (backerInfo && !dbOrder.kickstarter_backing_amount_gbp) {
        updates.kickstarter_backing_amount_gbp = backerInfo.backing_amount_gbp;
        updates.kickstarter_backing_amount_usd = backerInfo.backing_amount_gbp * 1.34; // Approx rate
        updatedCount++;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('orders')
          .update(updates)
          .eq('id', dbOrder.id);
        
        if (error) console.error(`Error updating order ${csvOrder.name}:`, error.message);
      }
    }
  }

  console.log(`Sync complete! Linked ${linkedCount} orders to emails. Updated ${updatedCount} orders with Kickstarter info.`);
}

syncFromCSV().catch(console.error);

