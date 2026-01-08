const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkTypes() {
  const env = fs.readFileSync('.env', 'utf8');
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);

  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

  // Using a direct select from information_schema
  const { data, error } = await supabase.from('products').select('product_id').limit(1);
  console.log('Sample product_id from products table:', typeof data?.[0]?.product_id, data?.[0]?.product_id);

  const { data: v2Data } = await supabase.from('order_line_items_v2').select('product_id').limit(1);
  console.log('Sample product_id from order_line_items_v2 table:', typeof v2Data?.[0]?.product_id, v2Data?.[0]?.product_id);
}

checkTypes();

