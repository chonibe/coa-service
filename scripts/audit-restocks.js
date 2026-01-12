const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function auditRestocks() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Restock Protocol Audit ---');

  // Find all orders with refunds
  const { data: ordersWithRefunds } = await supabase
    .from('orders')
    .select('id, order_name, raw_shopify_order_data')
    .not('raw_shopify_order_data->refunds', 'is', null);

  console.log(`Checking ${ordersWithRefunds?.length || 0} orders with refunds...`);

  const restockedLineItemIds = new Set();
  ordersWithRefunds?.forEach(order => {
    const refunds = order.raw_shopify_order_data?.refunds || [];
    refunds.forEach(refund => {
      refund.refund_line_items?.forEach(ri => {
        if (ri.restock === true || ri.restock_type === 'cancel' || ri.restock_type === 'return') {
          restockedLineItemIds.add(ri.line_item_id.toString());
        }
      });
    });
  });

  console.log(`Found ${restockedLineItemIds.size} restocked line item IDs in Shopify data.`);

  if (restockedLineItemIds.size > 0) {
    const { data: violations } = await supabase
      .from('order_line_items_v2')
      .select('id, name, edition_number, status, order_name, line_item_id')
      .in('line_item_id', Array.from(restockedLineItemIds))
      .not('edition_number', 'is', null);

    console.log(`Restocked items that still have edition numbers: ${violations?.length || 0}`);
    if (violations?.length > 0) {
      console.log('VIOLATIONS FOUND:', violations);
    } else {
      console.log('✅ PASS: All restocked items have NULL edition numbers.');
    }
    
    // Also check if any are marked as 'active'
    const { data: activeRestocked } = await supabase
      .from('order_line_items_v2')
      .select('id, name, status, order_name, line_item_id')
      .in('line_item_id', Array.from(restockedLineItemIds))
      .eq('status', 'active');

    console.log(`Restocked items still marked as 'active': ${activeRestocked?.length || 0}`);
    if (activeRestocked?.length > 0) {
        console.log('ACTIVE RESTOCKED ITEMS:', activeRestocked);
    }
  }
}

auditRestocks();

