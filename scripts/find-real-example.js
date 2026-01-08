const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);

  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

  const orderId = "12182601859458"; // Order #1279 from previous result
  
  console.log(`Checking details for real Order #${orderId}...`);
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, customer_email, customer_id')
    .eq('id', orderId)
    .single();

  console.log('Order Info:', JSON.stringify(order, null, 2));
  
  const { data: items } = await supabase
    .from('order_line_items_v2')
    .select('name, edition_number, status, owner_email, owner_name')
    .eq('order_id', orderId);
    
  console.log('Line Items:', JSON.stringify(items, null, 2));
}

run();
