const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkBoxes() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/); // Fixed typo in previous step logic
  const keyMatchReal = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatchReal[1].trim();
  const supabase = createClient(url, key);

  const { data } = await supabase.from('order_line_items_v2').select('name, vendor_name').ilike('name', '%box%').limit(20);
  console.log('Items with "box" in name:');
  console.table(data);

  const { data: streetItems } = await supabase.from('order_line_items_v2').select('name, vendor_name').ilike('vendor_name', '%Street%').limit(20);
  console.log('\nItems with "Street" in vendor_name:');
  console.table(streetItems);
}

checkBoxes();

