const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkNames() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const { data } = await supabase.from('orders').select('order_name').limit(100);
  const names = data.map(d => d.order_name);
  console.log('Sample Order Names:', names);
  console.log('Any starting with Simply?', names.filter(n => n.startsWith('Simply')));
}

checkNames();

