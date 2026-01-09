const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function deepSearchBittmann() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('Searching raw_shopify_order_data for "Bittmann"...');
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_name, customer_email, customer_name, raw_shopify_order_data')
    .not('raw_shopify_order_data', 'is', null);

  if (error) {
    console.error(error);
    return;
  }

  const results = data.filter(o => 
    JSON.stringify(o.raw_shopify_order_data).toLowerCase().includes('bittmann')
  );

  console.log(`Found ${results.length} orders mentioning "Bittmann" in raw data:`);
  results.forEach(o => {
    console.log(`- ${o.order_name}, Email: ${o.customer_email}, Name: ${o.customer_name}`);
  });
}

deepSearchBittmann();

