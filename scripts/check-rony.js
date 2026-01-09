const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkRony() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const email = 'itzcovich.rony@gmail.com';
  console.log(`Checking for ${email}...`);

  const { data: orders } = await supabase.from('orders').select('id, customer_email, order_name').ilike('customer_email', email);
  console.log('Orders:', orders);
}

checkRony();

