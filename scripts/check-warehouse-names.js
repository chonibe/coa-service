const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkWarehouseNames() {
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

  const orderIds = ['#1102', '#1101', '#1100', '#1099', '#1098', '#1097', '#1096'];
  console.log('Checking warehouse data for orders:', orderIds);

  for (const id of orderIds) {
    const { data: wo } = await supabase
      .from('warehouse_orders')
      .select('*')
      .eq('order_id', id)
      .maybeSingle();

    if (wo) {
      console.log(`\nOrder ${id} (Warehouse):`);
      console.log(`  Ship Name: ${wo.ship_name}`);
      console.log(`  Ship Email: ${wo.ship_email}`);
    } else {
      console.log(`\nOrder ${id} (Warehouse): NOT FOUND`);
    }
  }
}

checkWarehouseNames().catch(console.error);

