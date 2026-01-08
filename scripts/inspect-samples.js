const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function inspect() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('--- Inspecting Samples ---');
  
  const { data: wh } = await supabase.from('warehouse_orders').select('*').limit(1);
  console.log('\nWarehouse Sample:');
  console.log(JSON.stringify(wh, null, 2));
  
  const { data: ord } = await supabase.from('orders').select('*').limit(1);
  console.log('\nOrder Sample:');
  console.log(JSON.stringify(ord, null, 2));
}

inspect();

