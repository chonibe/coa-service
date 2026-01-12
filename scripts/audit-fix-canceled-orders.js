const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function auditAndFixCanceledOrders() {
  console.log('--- Auditing Orders for Hidden Cancellations ---');
  
  // Find orders marked as pending or fulfilled but having cancelled_at in raw data
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, fulfillment_status, raw_shopify_order_data')
    .not('raw_shopify_order_data', 'is', null);

  if (error) return console.error('Error fetching orders:', error);

  let fixCount = 0;
  let affectedProducts = new Set();

  for (const order of orders) {
    const raw = order.raw_shopify_order_data;
    const isActuallyCanceled = raw.cancelled_at !== null || raw.financial_status === 'voided' || raw.financial_status === 'refunded';
    const isMarkedActive = order.fulfillment_status !== 'canceled';

    if (isActuallyCanceled && isMarkedActive) {
      console.log(`Fixing Order #${order.order_number} (${order.id}) - Should be canceled.`);
      
      // 1. Update Order
      await supabase.from('orders').update({
        fulfillment_status: 'canceled',
        financial_status: raw.financial_status === 'paid' ? 'voided' : raw.financial_status,
        cancelled_at: raw.cancelled_at,
        archived: true
      }).eq('id', order.id);

      // 2. Update Line Items
      const { data: items } = await supabase.from('order_line_items_v2').update({
        status: 'inactive'
      }).eq('order_id', order.id).select('product_id');

      if (items) {
        items.forEach(i => affectedProducts.add(i.product_id));
      }
      
      fixCount++;
    }
  }

  console.log(`\nFixed ${fixCount} orders.`);

  if (affectedProducts.size > 0) {
    console.log(`Re-assigning editions for ${affectedProducts.size} products...`);
    for (const pid of Array.from(affectedProducts)) {
      if (!pid) continue;
      await supabase.rpc('assign_edition_numbers', { p_product_id: pid });
    }
  }

  console.log('Audit and fix complete.');
}

auditAndFixCanceledOrders();
