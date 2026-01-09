const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function deepSearchOransh() {
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

  console.log('Searching for "oransh" in all order fields...');
  const { data: allOrders, error } = await supabase
    .from('orders')
    .select('id, order_name, customer_email, raw_shopify_order_data');

  const matches = allOrders.filter(o => {
    const str = JSON.stringify(o).toLowerCase();
    return str.includes('oransh');
  });

  console.log(`Found ${matches.length} matching orders:`);
  matches.forEach(m => {
    console.log(`- Order: ${m.order_name}, Email: ${m.customer_email}, ID: ${m.id}`);
  });

  console.log('\nChecking backer entry:');
  const { data: backer } = await supabase
    .from('kickstarter_backers_list')
    .select('*')
    .ilike('email', '%oransh10@gmail.com%');
  console.log(backer);
}

deepSearchOransh().catch(console.error);

