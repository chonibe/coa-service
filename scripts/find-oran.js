const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function findOran() {
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

  console.log('Searching for "Oran" in orders...');
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_name, customer_email, raw_shopify_order_data')
    .limit(5000); // Fetch a lot since we need to search inside JSON

  if (error) {
    console.error(error);
    return;
  }

  const results = orders.filter(o => {
    const dataStr = JSON.stringify(o).toLowerCase();
    return dataStr.includes('oran') || dataStr.includes('sh');
  });

  console.log(`Found ${results.length} possible matches:`);
  results.forEach(r => {
    console.log(`- Order: ${r.order_name}, Email: ${r.customer_email}, ID: ${r.id}`);
    const cust = r.raw_shopify_order_data?.customer;
    if (cust) {
      console.log(`  Customer: ${cust.first_name} ${cust.last_name} (${cust.email})`);
    }
  });
}

findOran().catch(console.error);

