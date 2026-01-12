const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDeduplication() {
  const shopifyId = '7871916114147';
  const email = 'hypstudio@gmail.com';
  
  console.log('--- Debugging Order Deduplication for Debra Goodman ---');

  // 1. Fetch orders matching email or ID
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, order_name, fulfillment_status, financial_status, customer_email')
    .or(`customer_id.eq.${shopifyId},customer_email.ilike.${email}`);

  console.log(`Total orders found by query: ${orders.length}`);

  // 2. Fetch all v2 line items for these specific orders to see where the data lives
  const orderIds = orders.map(o => o.id);
  const { data: items } = await supabase
    .from('order_line_items_v2')
    .select('id, order_id, name, status')
    .in('order_id', orderIds);

  console.log(`Total line items found for these orders: ${items.length}`);

  // 3. Analyze item distribution
  const orderItemCounts = items.reduce((acc, item) => {
    acc[item.order_id] = (acc[item.order_id] || 0) + 1;
    return acc;
  }, {});

  orders.forEach(o => {
    const count = orderItemCounts[o.id] || 0;
    const match = o.order_name?.replace('#', '').match(/^\d+/);
    const cleanName = match ? match[0] : (o.order_name?.toLowerCase() || o.id);
    console.log(`Order ${o.id} | #${o.order_number} | Clean: ${cleanName} | Items: ${count} | Email: ${o.customer_email} | Fulfil: ${o.fulfillment_status}`);
  });

  // 4. Simulate deduplication logic
  const orderMap = new Map();
  orders.forEach(order => {
    const match = order.order_name?.replace('#', '').match(/^\d+/);
    const cleanName = match ? match[0] : (order.order_name?.toLowerCase() || order.id);
    
    const existing = orderMap.get(cleanName);
    const isManual = order.id.startsWith('WH-');
    const existingIsManual = existing?.id.startsWith('WH-');

    if (!existing || (existingIsManual && !isManual)) {
      orderMap.set(cleanName, order);
    }
  });

  console.log('\n--- Orders kept after deduplication ---');
  let totalItemsKept = 0;
  Array.from(orderMap.values()).forEach(o => {
    const count = orderItemCounts[o.id] || 0;
    totalItemsKept += count;
    console.log(`KEPT: Order ${o.id} | #${o.order_number} | Items: ${count}`);
  });
  console.log(`Total items kept after deduplication: ${totalItemsKept}`);
}

checkDeduplication();
