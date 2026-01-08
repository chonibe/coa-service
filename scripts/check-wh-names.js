const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkWarehouseNames() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const { data } = await supabase.from('warehouse_orders').select('order_id').limit(20);
  console.log('Sample Warehouse order IDs:');
  console.table(data);
}

checkWarehouseNames();

