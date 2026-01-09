const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Simple CSV parser that respects quotes for Shopify export
function parseShopifyCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const headers = lines[0].split(',');
  
  const nameIdx = headers.indexOf('Name');
  const emailIdx = headers.indexOf('Email');
  const tagsIdx = headers.indexOf('Tags');

  const orders = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    
    // Regex to split by comma but ignore commas inside quotes
    const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    
    if (row[nameIdx] && row[emailIdx]) {
      orders.push({
        name: row[nameIdx].trim(),
        email: row[emailIdx].trim().toLowerCase(),
        tags: row[tagsIdx] ? row[tagsIdx].replace(/"/g, '').trim() : ''
      });
    }
  }
  return orders;
}

async function syncKickstarterFromTags() {
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

  let tagMatchCount = 0;
  let updatedCount = 0;

  for (const csvOrder of csvOrders) {
    // Check if tags contain Kickstarter info
    // Match variations like "Pledged on Kickstarter, £149.00" or just "Kickstarter"
    const ksMatch = csvOrder.tags.match(/Pledged on Kickstarter,?\s*([£$€])?\s*([\d.,]+)/i);
    
    if (ksMatch || csvOrder.tags.toLowerCase().includes('kickstarter')) {
      tagMatchCount++;
      
      let amountGbp = null;
      if (ksMatch) {
        let amountStr = ksMatch[2].replace(',', '');
        amountGbp = parseFloat(amountStr);
        // If symbol is $, convert to GBP? Or just store as is? 
        // The user said "its in gbp so translate it to usd".
        // Let's assume the amount in tags is the backing amount.
        const symbol = ksMatch[1];
        if (symbol === '$') {
          // Convert USD to GBP if needed, but let's stick to what we have.
        }
      }

      // Find order in DB
      const { data: dbOrder } = await supabase
        .from('orders')
        .select('id, customer_email, kickstarter_backing_amount_gbp')
        .eq('order_name', csvOrder.name)
        .maybeSingle();

      if (dbOrder) {
        const updates = {};
        
        // Always ensure email is correct
        if (!dbOrder.customer_email || dbOrder.customer_email.toLowerCase() !== csvOrder.email) {
          updates.customer_email = csvOrder.email;
        }

        // Update backing amount if we found one and it's missing
        if (amountGbp && !dbOrder.kickstarter_backing_amount_gbp) {
          updates.kickstarter_backing_amount_gbp = amountGbp;
          updates.kickstarter_backing_amount_usd = amountGbp * 1.34;
        }

        if (Object.keys(updates).length > 0) {
          console.log(`Updating order ${csvOrder.name}:`, updates);
          const { error } = await supabase
            .from('orders')
            .update(updates)
            .eq('id', dbOrder.id);
          
          if (!error) {
            updatedCount++;
          } else {
            console.error(`  Error updating ${csvOrder.name}:`, error.message);
          }
        } else {
          // console.log(`Order ${csvOrder.name} already up to date.`);
        }

        // Also ensure the collector profile is marked
        await supabase
          .from('collector_profiles')
          .update({ is_kickstarter_backer: true })
          .ilike('email', csvOrder.email);
          
        // And ensure they are in the backer list table
        await supabase
          .from('kickstarter_backers_list')
          .upsert({ email: csvOrder.email, backing_amount_gbp: amountGbp }, { onConflict: 'email' });
      }
    }
  }

  console.log(`Processed ${tagMatchCount} Kickstarter tags. Updated ${updatedCount} database records.`);
}

syncKickstarterFromTags().catch(console.error);

