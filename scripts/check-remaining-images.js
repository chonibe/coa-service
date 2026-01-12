const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkRemainingMissing() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Checking Remaining Missing Images ---');

  const { data: missing } = await supabase
    .from('order_line_items_v2')
    .select('id, name, product_id, vendor_name')
    .is('img_url', null);

  console.log(`Still missing img_url: ${missing?.length || 0}`);
  
  if (missing && missing.length > 0) {
    const uniquePids = [...new Set(missing.map(m => m.product_id).filter(Boolean))];
    console.log('Unique Product IDs missing images:', uniquePids);
    
    const { data: pCheck } = await supabase
        .from('products')
        .select('product_id, shopify_id, name')
        .in('product_id', uniquePids);
    
    console.log('\nProducts found in DB for these IDs:', pCheck?.length || 0);
    
    missing.slice(0, 10).forEach(m => {
        console.log(`- ${m.name} (PID: ${m.product_id}, Vendor: ${m.vendor_name})`);
    });
  }
}

checkRemainingMissing();

