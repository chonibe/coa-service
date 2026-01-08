const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function inspectRaw() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const { data } = await supabase.from('warehouse_orders').select('*').eq('ship_email', 'sfabercastell@live.com').limit(1);
  console.log('Record Keys:', Object.keys(data[0]));
  console.log('Raw Data Type:', typeof data[0].raw_data);
  console.log('Raw Data Content:', JSON.stringify(data[0].raw_data, null, 2));
}

inspectRaw();

