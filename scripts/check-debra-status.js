const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCurrentState() {
  const shopifyId = '7871916114147';
  const { data: items } = await supabase
    .from('order_line_items_v2')
    .select('name, status, restocked, order_id, order_name, orders(fulfillment_status, financial_status)')
    .eq('shopify_customer_id', shopifyId);
    
  console.log('--- Current Status for Debra Goodman ---');
  if (!items) return console.log('No items found');
  
  const summary = items.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});
  console.log('Status Summary:', summary);

  console.log('\nAll items:');
  items.forEach(i => {
    console.log(`Item: ${i.name.padEnd(30)} | Status: ${i.status.padEnd(10)} | Restocked: ${i.restocked} | Order: ${i.order_name} | Order Ful: ${i.orders?.fulfillment_status} | Order Fin: ${i.orders?.financial_status}`);
  });
}
checkCurrentState();
