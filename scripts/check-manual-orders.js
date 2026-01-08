const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkManualOrders() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('--- Manual Orders Check ---');
  const { data, count } = await supabase
    .from('orders')
    .select('id, customer_email', { count: 'exact' })
    .ilike('id', 'WH-%');
  
  console.log(`Manual Orders Found: ${count}`);
  const withEmail = data.filter(d => d.customer_email).length;
  console.log(`With Email: ${withEmail}`);
  console.log(`Without Email: ${count - withEmail}`);

  if (count - withEmail > 0) {
    console.log('\nSamples without email:');
    console.table(data.filter(d => !d.customer_email).slice(0, 5));
  }
}

checkManualOrders();

