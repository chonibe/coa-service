const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkMissing() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('Orders with customer_id but NO email:');
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_name, customer_id, customer_email')
    .is('customer_email', null)
    .not('customer_id', 'is', null)
    .limit(10);

  if (error) console.error(error);
  else console.log(data);
}

checkMissing();

