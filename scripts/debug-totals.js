const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkEditionTotals() {
  const shopifyId = '7871916114147';
  const { data: items } = await supabase
    .from('order_line_items_v2')
    .select('name, edition_number, edition_total')
    .eq('shopify_customer_id', shopifyId)
    .not('edition_number', 'is', null);
    
  console.log('--- Debra Goodman Edition Totals ---');
  if (!items) return console.log('No items found');
  
  items.forEach(i => {
    console.log(`Item: ${i.name.padEnd(25)} | Ed: #${i.edition_number} | Total: ${i.edition_total}`);
  });
}

checkEditionTotals();
