const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixCollector() {
  const shopifyId = '7871916114147';
  const orderNumbers = [1160, 1147, 1116];
  
  console.log('--- Fixing Orders for Collector 7871916114147 ---');
  
  for (const num of orderNumbers) {
    const { data: order } = await supabase.from('orders').select('id, raw_shopify_order_data').eq('order_number', num).single();
    if (order) {
      const raw = order.raw_shopify_order_data;
      const cancelledAt = raw.cancelled_at;
      
      if (cancelledAt) {
        console.log(`Updating Order #${num} to canceled status (Cancelled at: ${cancelledAt})`);
        
        // 1. Update order status
        const { error: oError } = await supabase.from('orders').update({
          fulfillment_status: 'canceled',
          financial_status: 'voided',
          cancelled_at: cancelledAt,
          archived: true
        }).eq('id', order.id);
        
        if (oError) console.error(`Error updating order #${num}:`, oError);
        
        // 2. Update all line items for this order to inactive
        const { error: liError } = await supabase.from('order_line_items_v2').update({
          status: 'inactive'
        }).eq('order_id', order.id);
        
        if (liError) console.error(`Error updating items for order #${num}:`, liError);
        
        console.log(`Order #${num} and its items are now inactive.`);
      } else {
        console.log(`Order #${num} raw data does not show cancellation. Checking financial status...`);
        if (raw.financial_status === 'voided' || raw.financial_status === 'refunded') {
            await supabase.from('orders').update({ archived: true }).eq('id', order.id);
            await supabase.from('order_line_items_v2').update({ status: 'inactive' }).eq('order_id', order.id);
        }
      }
    }
  }
  
  // 3. Trigger edition re-assignment for affected products
  console.log('\n--- Re-triggering Edition Assignment ---');
  const { data: items } = await supabase.from('order_line_items_v2').select('product_id').eq('shopify_customer_id', shopifyId);
  const pids = Array.from(new Set(items.map(i => i.product_id))).filter(Boolean);
  
  console.log(`Re-assigning editions for ${pids.length} products...`);
  for (const pid of pids) {
    const { error: rpcError } = await supabase.rpc('assign_edition_numbers', { p_product_id: pid });
    if (rpcError) console.error(`RPC Error for product ${pid}:`, rpcError);
  }
  
  console.log('Fix complete. Verify in UI.');
}

fixCollector();
