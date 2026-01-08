const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkSmoses() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const email = 'smoses@live.de';
  const { data: viewData } = await supabase
    .from('collector_profile_comprehensive')
    .select('display_name, total_editions, total_orders')
    .eq('user_email', email)
    .maybeSingle();
  
  console.log(`Collector: ${email}`);
  console.table(viewData);

  const { data: items } = await supabase
    .from('order_line_items_v2')
    .select('name, vendor_name, status, owner_email')
    .eq('owner_email', email);
  
  console.log('Items in v2 for Smoses:');
  console.table(items);
}

checkSmoses();

