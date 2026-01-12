const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function debugCollectorOrders() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const shopifyCustomerId = '7908039164131';
  
  console.log(`--- Debugging Collector ${shopifyCustomerId} ---`);

  // 1. Find orders for this collector
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_name, financial_status, fulfillment_status, cancelled_at, archived, raw_shopify_order_data')
    .eq('customer_id', shopifyCustomerId);

  console.log(`Found ${orders?.length || 0} orders.`);

  if (orders && orders.length > 0) {
    for (const order of orders) {
      console.log(`\nOrder: ${order.order_name} (ID: ${order.id})`);
      console.log(`- Financial: ${order.financial_status}`);
      console.log(`- Fulfillment: ${order.fulfillment_status}`);
      console.log(`- Cancelled At: ${order.cancelled_at}`);
      console.log(`- Archived: ${order.archived}`);
      
      // 2. Find line items for this order
      const { data: items } = await supabase
        .from('order_line_items_v2')
        .select('id, name, status, fulfillment_status, edition_number')
        .eq('order_id', order.id);
      
      console.log(`- Line Items (${items?.length || 0}):`);
      items?.forEach(li => {
        console.log(`  - ${li.name}: Status=${li.status}, Full=${li.fulfillment_status}, Edition=#${li.edition_number}`);
      });
    }
  }
}

debugCollectorOrders();

