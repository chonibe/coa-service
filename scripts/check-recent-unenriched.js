const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkRecentUnenriched() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('Checking unenriched orders from Sept 2024 onwards...');
  const { data } = await supabase
    .from('orders')
    .select('id, order_name, created_at')
    .is('customer_email', null)
    .gte('created_at', '2024-09-01T00:00:00Z');
  
  console.log(`Unenriched recent orders: ${data.length}`);
  if (data.length > 0) {
    console.table(data.slice(0, 10));
  }
}

checkRecentUnenriched();

