const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function searchPhilipInCSV() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const csvPath = 'c:\\Users\\choni\\Downloads\\orders_export_1 (13).csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  console.log('Searching CSV for "Philip" or "Bittmann"...');
  const matches = records.filter(r => 
    (r['Billing Name'] && r['Billing Name'].toLowerCase().includes('philip')) || 
    (r['Shipping Name'] && r['Shipping Name'].toLowerCase().includes('philip')) ||
    (r['Billing Name'] && r['Billing Name'].toLowerCase().includes('bittmann')) ||
    (r['Shipping Name'] && r['Shipping Name'].toLowerCase().includes('bittmann'))
  );

  console.log(`Found ${matches.length} matching rows in CSV:`);
  matches.forEach(m => console.log(`- Order: ${m['Name']}, Email: ${m['Email']}, Name: ${m['Billing Name'] || m['Shipping Name']}`));

  console.log('\nSearching warehouse_orders for "Philip" or "Bittmann"...');
  const { data: wh, error: whErr } = await supabase
    .from('warehouse_orders')
    .select('id, ship_name, ship_email, order_id')
    .or('ship_name.ilike.%Philip%,ship_name.ilike.%Bittmann%');

  if (whErr) console.error(whErr);
  else {
    console.log(`Found ${wh.length} matches in warehouse_orders:`);
    wh.forEach(w => console.log(`- Order: ${w.order_id}, Email: ${w.ship_email}, Name: ${w.ship_name}`));
  }
}

searchPhilipInCSV();

