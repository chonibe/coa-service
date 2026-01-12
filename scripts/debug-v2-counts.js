const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkOrders() {
  const email = 'hypstudio@gmail.com';
  const { data: orders } = await supabase.from('orders').select('id, order_number, customer_email, customer_id').ilike('customer_email', email);
  console.log('Orders found by email:', orders.length);
  
  for (const o of orders) {
    const { count, error } = await supabase
      .from('order_line_items_v2')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', o.id);
    console.log(`Order ${o.id} (#${o.order_number}) v2 count:`, count);
  }

  // Also check by shopify_customer_id directly in v2 table
  const shopifyId = '7871916114147';
  const { count: v2Count } = await supabase
    .from('order_line_items_v2')
    .select('*', { count: 'exact', head: true })
    .eq('shopify_customer_id', shopifyId);
  console.log(`Total v2 items by shopify_customer_id (${shopifyId}):`, v2Count);
}

checkOrders();
