const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkStatuses() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const { data } = await supabase.from('order_line_items_v2').select('status');
  const statuses = [...new Set(data.map(d => d.status))];
  console.log('Unique statuses in v2:', statuses);

  const { data: vendors } = await supabase.from('order_line_items_v2').select('vendor_name').limit(1000);
  const uniqueVendors = [...new Set(vendors.map(v => v.vendor_name).filter(Boolean))];
  console.log('\nUnique vendors in v2 (sample):', uniqueVendors);
}

checkStatuses();

