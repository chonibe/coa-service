const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkParker() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const email = 'parker.gootkin@gmail.com';
  console.log(`Checking for ${email}...`);

  const { data: orders } = await supabase.from('orders').select('id, financial_status, cancelled_at').ilike('customer_email', email);
  console.log('Orders:', orders);

  if (orders && orders.length > 0) {
    const { data: items } = await supabase.from('order_line_items_v2').select('id, name, edition_number, status, restocked').in('order_id', orders.map(o => o.id));
    console.log('Items:', items);
  }
}

checkParker();

