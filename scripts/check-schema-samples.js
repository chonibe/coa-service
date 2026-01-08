const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);

  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

  console.log('Sample product:');
  const { data: product } = await supabase.from('products').select('*').limit(1);
  console.log(JSON.stringify(product, null, 2));
  
  console.log('\nSample v2 item:');
  const { data: v2Item } = await supabase.from('order_line_items_v2').select('*').limit(1);
  console.log(JSON.stringify(v2Item, null, 2));
}

run();

