const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function verifyStrictLogic() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('Verifying Street Collector items...');
  const { data: scItems } = await supabase
    .from('order_line_items_v2')
    .select('id, name, edition_number')
    .ilike('vendor_name', 'Street Collector')
    .not('edition_number', 'is', null)
    .eq('status', 'active');
  
  console.log(`Street Collector items with edition numbers: ${scItems?.length || 0}`);
  if (scItems?.length > 0) {
    console.log('SAMPLES OF INCORRECT ITEMS:', scItems.slice(0, 5));
  } else {
    console.log('✅ PASS: No Street Collector items have edition numbers.');
  }

  console.log('\nVerifying Canceled/Restocked orders...');
  const { data: invalidItems } = await supabase
    .from('order_line_items_v2')
    .select('id, edition_number, orders!inner(fulfillment_status, financial_status)')
    .not('edition_number', 'is', null)
    .or('orders.fulfillment_status.in.(restocked,canceled),orders.financial_status.in.(refunded,voided)');

  console.log(`Invalid order items with edition numbers: ${invalidItems?.length || 0}`);
  if (invalidItems?.length > 0) {
    console.log('SAMPLES OF INCORRECT ITEMS:', invalidItems.slice(0, 5));
  } else {
    console.log('✅ PASS: No canceled/restocked/refunded order items have edition numbers.');
  }
}

verifyStrictLogic();

