const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);

  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

  console.log('Extracting PII from raw Shopify data for #1331...');
  const { data: order } = await supabase
    .from('orders')
    .select('raw_shopify_order_data')
    .eq('id', '12547767796098')
    .single();

  if (order && order.raw_shopify_order_data) {
    const raw = order.raw_shopify_order_data;
    console.log('--- Found in Raw Data ---');
    console.log(`Email: ${raw.email}`);
    console.log(`Contact Email: ${raw.contact_email}`);
    console.log(`Customer: ${raw.customer ? raw.customer.first_name + ' ' + raw.customer.last_name : 'No Customer Object'}`);
    console.log(`Shipping Address: ${raw.shipping_address ? raw.shipping_address.name : 'No Shipping Object'}`);
    console.log(`Customer ID: ${raw.customer ? raw.customer.id : 'N/A'}`);
  } else {
    console.log('No raw data found.');
  }
}

run();

