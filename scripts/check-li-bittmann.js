const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkLineItemsBittmann() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('Checking order_line_items_v2 for "Bittmann"...');
  const { data, error } = await supabase
    .from('order_line_items_v2')
    .select('id, order_id, order_name, owner_email, owner_name')
    .or('owner_name.ilike.%Bittmann%,owner_email.ilike.%Bittmann%');

  if (error) console.error(error);
  else {
    console.log(`Found ${data.length} line items:`);
    data.forEach(d => console.log(`- Order: ${d.order_name}, Email: ${d.owner_email}, Name: ${d.owner_name}`));
  }
}

checkLineItemsBittmann();

