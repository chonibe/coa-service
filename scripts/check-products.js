const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkProducts() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const { data } = await supabase.from('products').select('vendor, product_type').limit(100);
  console.log('Unique vendors and types in products:');
  const vendors = [...new Set(data.map(d => d.vendor).filter(Boolean))];
  const types = [...new Set(data.map(d => d.product_type).filter(Boolean))];
  console.log('Vendors:', vendors);
  console.log('Types:', types);
}

checkProducts();
