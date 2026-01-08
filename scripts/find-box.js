const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function findBox() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('Searching for "box" in warehouse_orders...');
  const { data } = await supabase.from('warehouse_orders').select('order_id, raw_data');
  const filtered = (data || []).filter(d => JSON.stringify(d.raw_data).toLowerCase().includes('box'));
  
  console.log(`Found ${filtered.length} records containing "box"`);
  if (filtered.length > 0) {
    filtered.slice(0, 3).forEach(f => {
      console.log(`Order: ${f.order_id}`);
      console.log(`Raw Data:`, JSON.stringify(f.raw_data, null, 2).substring(0, 1000));
    });
  }
}

findBox();

