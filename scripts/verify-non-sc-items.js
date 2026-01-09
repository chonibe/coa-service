const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: items, error: fetchError } = await supabase
    .from('order_line_items_v2')
    .select('name, vendor_name, edition_number, product_id')
    .neq('vendor_name', 'Street Collector')
    .not('edition_number', 'is', null)
    .limit(5);

  if (fetchError) {
    console.error('Error fetching items:', fetchError);
    return;
  }

  console.log('Non-Street Collector Items (Before):', items);

  if (items.length > 0) {
    const pid = items[0].product_id;
    console.log(`Triggering reassignment for product: ${pid}`);
    const { error: rpcError } = await supabase.rpc('assign_edition_numbers', { p_product_id: pid.toString() });
    
    if (rpcError) {
      console.error('Error triggering RPC:', rpcError);
    } else {
      const { data: updatedItems } = await supabase
        .from('order_line_items_v2')
        .select('name, vendor_name, edition_number')
        .eq('product_id', pid)
        .limit(5);
      console.log('Non-Street Collector Items (After):', updatedItems);
    }
  }
}

run();
