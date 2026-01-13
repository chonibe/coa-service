const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkEditions() {
  const shopifyId = '7871916114147';
  const { data: items } = await supabase
    .from('order_line_items_v2')
    .select('name, edition_number, edition_total, status, product_id')
    .eq('shopify_customer_id', shopifyId)
    .eq('status', 'active');
    
  console.log('--- Editions for Active Items (Debra) ---');
  if (!items) return console.log('No items found');
  items.forEach(i => {
    console.log(`Item: ${i.name.padEnd(30)} | Edition: ${i.edition_number}/${i.edition_total} | PID: ${i.product_id}`);
  });
}
checkEditions();
