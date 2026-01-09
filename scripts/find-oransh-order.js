const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function findOranshOrder() {
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

  console.log('Searching for "Oran" in all orders...');
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .limit(10000);

  const oranshEmails = ['oransh10@gmail.com', 'oransh@gmail.com', 'oran@gmail.com'];
  
  const matches = orders.filter(o => {
    const dataStr = JSON.stringify(o).toLowerCase();
    return dataStr.includes('oran') || dataStr.includes('sh10');
  });

  console.log(`Found ${matches.length} matches:`);
  matches.forEach(m => {
    console.log(`- Order: ${m.order_name}, Email: ${m.customer_email}, ID: ${m.id}`);
    const cust = m.raw_shopify_order_data?.customer;
    if (cust) {
      console.log(`  Customer: ${cust.first_name} ${cust.last_name} (${cust.email})`);
    }
  });
}

findOranshOrder().catch(console.error);

