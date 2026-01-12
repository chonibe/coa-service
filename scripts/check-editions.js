const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkEditionNumbers() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('Checking edition numbers for order #1182...');
  const { data: order } = await supabase.from('orders').select('id').eq('order_name', '#1182').single();
  
  if (order) {
    const { data: items } = await supabase
      .from('order_line_items_v2')
      .select('id, name, edition_number, status')
      .eq('order_id', order.id);
    
    console.log('Line Items for #1182:');
    items.forEach(item => {
      console.log(`- ${item.name}: Edition #${item.edition_number}, Status: ${item.status}`);
    });
  } else {
    console.log('Order #1182 not found.');
  }

  console.log('\nChecking global edition number stats...');
  const { data: stats, error } = await supabase
    .from('order_line_items_v2')
    .select('edition_number', { count: 'exact' })
    .not('edition_number', 'is', null)
    .limit(1);
  
  const { count: nullCount } = await supabase
    .from('order_line_items_v2')
    .select('edition_number', { count: 'exact' })
    .is('edition_number', null);

  console.log(`Total items with edition numbers: ${stats?.length > 0 ? stats.length : 0} (approx)`);
  console.log(`Total items with NULL edition numbers: ${nullCount}`);
}

checkEditionNumbers();

