const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function debug() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('--- Debugging Warehouse/Order Link ---');
  
  const { data: wh } = await supabase.from('warehouse_orders').select('ship_email, ship_name').limit(10);
  console.log('\nWarehouse Email Samples:');
  console.table(wh);
  
  const emails = wh.map(w => w.ship_email).filter(Boolean);
  
  if (emails.length > 0) {
    console.log(`\nChecking if these emails exist in the 'orders' table...`);
    const { data: ord } = await supabase.from('orders').select('customer_email').in('customer_email', emails);
    console.log('Matches found in orders:', ord);
    
    if (ord && ord.length > 0) {
      const matchEmail = ord[0].customer_email;
      console.log(`\nFound a match for email: ${matchEmail}`);
      const { data: viewData } = await supabase.from('collector_profile_comprehensive').select('*').eq('user_email', matchEmail.toLowerCase()).maybeSingle();
      console.log('\nView data for matched email:');
      console.log(JSON.stringify(viewData, null, 2));
    }
  }
}

debug();

