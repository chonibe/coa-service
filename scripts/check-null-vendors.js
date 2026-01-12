const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkNullVendors() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const { data: nullEditions } = await supabase
    .from('order_line_items_v2')
    .select('vendor_name, name')
    .is('edition_number', null)
    .eq('status', 'active');

  const vendors = new Map();
  nullEditions.forEach(item => {
    const v = item.vendor_name || 'Unknown';
    vendors.set(v, (vendors.get(v) || 0) + 1);
  });

  console.log('Vendors with NULL edition numbers (active items):');
  console.log(Array.from(vendors.entries()).sort((a, b) => b[1] - a[1]));
}

checkNullVendors();

