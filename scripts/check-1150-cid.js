const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function check1150CID() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const { data: order } = await supabase.from('orders').select('customer_id, raw_shopify_order_data').eq('id', '6070148169955').single();
  console.log('Customer ID:', order.customer_id);
  console.log('Raw ID:', order.raw_shopify_order_data.customer?.id);
  
  if (order.customer_id) {
    const { data: others } = await supabase.from('orders').select('id, order_name, customer_email, customer_name').eq('customer_id', order.customer_id);
    console.log('Other orders for this customer:', others);
  }
}

check1150CID();

