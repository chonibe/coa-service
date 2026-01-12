const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function auditShopifyStatusSync() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Shopify Status Sync Audit ---');

  // Check for orders where our columns might differ from raw data
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_name, financial_status, fulfillment_status, raw_shopify_order_data')
    .limit(100);

  let discrepancies = 0;
  orders.forEach(o => {
    const raw = o.raw_shopify_order_data;
    if (!raw) return;

    if (o.financial_status !== raw.financial_status) {
      console.log(`Discrepancy in financial_status for ${o.order_name}: DB=${o.financial_status}, Raw=${raw.financial_status}`);
      discrepancies++;
    }
    if (o.fulfillment_status !== (raw.fulfillment_status || 'pending')) {
      // Shopify fulfillment_status can be null
      const rawFull = raw.fulfillment_status || 'pending';
      if (o.fulfillment_status !== rawFull) {
        console.log(`Discrepancy in fulfillment_status for ${o.order_name}: DB=${o.fulfillment_status}, Raw=${rawFull}`);
        discrepancies++;
      }
    }
  });

  console.log(`\nTotal status discrepancies found in sample: ${discrepancies}`);

  // Check for line items that are 'active' but in orders that should be 'inactive'
  const { data: activeInInactiveOrders } = await supabase
    .from('order_line_items_v2')
    .select('id, name, order_name, status, orders!inner(fulfillment_status, financial_status, cancelled_at)')
    .eq('status', 'active')
    .or('orders.fulfillment_status.in.(restocked,canceled),orders.financial_status.in.(refunded,voided),orders.cancelled_at.not.is.null');

  console.log(`\nActive line items in invalid orders: ${activeInInactiveOrders?.length || 0}`);
  if (activeInInactiveOrders?.length > 0) {
    console.log('Samples:', activeInInactiveOrders.slice(0, 5));
  }
}

auditShopifyStatusSync();

