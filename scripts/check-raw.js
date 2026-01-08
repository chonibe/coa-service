const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkRaw() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const { data } = await supabase.from('warehouse_orders').select('raw_data').limit(5);
  console.log(JSON.stringify(data, null, 2));
}

checkRaw();

