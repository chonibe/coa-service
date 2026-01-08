const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);

  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

  const productId = "8693340209379"; // A Street Lamp
  
  console.log(`Investigating active items for product: ${productId}...`);
  const { data: items, error } = await supabase
    .from('order_line_items_v2')
    .select('id, order_id, order_name, status, fulfillment_status, restocked, removed_reason')
    .eq('product_id', productId)
    .eq('status', 'active');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${items.length} active items for a size limit of 100.`);
  
  // Show some samples to see if any should be inactive
  console.log('\nSample active items:');
  console.log(JSON.stringify(items.slice(0, 10), null, 2));
}

run();

