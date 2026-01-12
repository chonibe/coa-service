const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testAPILogic() {
  const shopifyId = '7871916114147';
  const email = 'hypstudio@gmail.com';
  
  console.log('--- Testing API Logic for Debra Goodman ---');

  // Try the OR query first
  const { data: orOrders, error: orError } = await supabase
    .from('orders')
    .select('id, order_number, customer_email, customer_id')
    .or(`customer_id.eq.${shopifyId},customer_email.ilike.${email}`);

  if (orError) console.error('OR Query Error:', orError);
  console.log('OR Query Result count:', orOrders?.length || 0);

  // Try separate queries to see if there's a difference
  const { data: idOrders } = await supabase.from('orders').select('id, order_number').eq('customer_id', shopifyId);
  const { data: emailOrders } = await supabase.from('orders').select('id, order_number').ilike('customer_email', email);

  console.log('ID Query Result count:', idOrders?.length || 0);
  console.log('Email Query Result count:', emailOrders?.length || 0);

  // Check line items for the orders found by ID
  if (idOrders && idOrders.length > 0) {
    const ids = idOrders.map(o => o.id);
    const { count } = await supabase.from('order_line_items_v2').select('*', { count: 'exact', head: true }).in('order_id', ids);
    console.log(`Total line items for the ${ids.length} ID orders:`, count);
  }
}

testAPILogic();
