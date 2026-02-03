const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deepSyncDebra() {
  const shopifyId = '7871916114147';
  console.log('--- Deep Syncing Collector 7871916114147 ---');

  // 1. Get all orders for this collector
  const { data: orders } = await supabase
    .from('orders')
    .select('raw_shopify_order_data')
    .eq('customer_id', shopifyId);

  if (!orders || orders.length === 0) return console.log('No orders found.');

  console.log(`Found ${orders.length} orders. Re-syncing with aggressive restock detection...`);

  for (const o of orders) {
    const order = o.raw_shopify_order_data;
    if (!order) continue;

    console.log(`Processing Order #${order.order_number}...`);
    
    const removedLineItemIds = new Set();
    if (order.refunds && Array.isArray(order.refunds)) {
      order.refunds.forEach((refund) => {
        refund.refund_line_items?.forEach((ri) => {
          removedLineItemIds.add(ri.line_item_id);
        });
      });
    }

    const dbLineItems = order.line_items.map((li) => {
      const liIdStr = li.id.toString();
      const refundEntry = order.refunds?.flatMap((r) => r.refund_line_items || [])
                                       .find((ri) => ri.line_item_id.toString() === liIdStr);
      
      const isRefunded = removedLineItemIds.has(li.id) || li.refund_status === 'refunded' || refundEntry !== undefined || (li.refunded_quantity && li.refunded_quantity > 0);
      const isRestocked = Boolean(
        li.restocked === true || 
        li.restock_type != null || 
        li.fulfillment_status === 'restocked' || 
        refundEntry?.restock_type != null
      );
      
      const removedProperty = li.properties?.find((p) => 
        (p.name === 'removed' || p.key === 'removed') && 
        (p.value === 'true' || p.value === true)
      );
      
      const isCancelled = order.financial_status === 'voided' || order.cancelled_at !== null || order.fulfillment_status === 'canceled';
      const isPaid = ['paid', 'authorized', 'pending', 'partially_paid'].includes(order.financial_status);
      
      const isInactive = isRefunded || removedProperty !== undefined || isCancelled || isRestocked;
      const status = isInactive ? 'inactive' : (isPaid ? 'active' : 'inactive');

      return {
        line_item_id: liIdStr,
        status: status,
        restocked: isRestocked,
        refund_status: 'none',
        updated_at: new Date().toISOString()
      };
    });

    for (const dbLi of dbLineItems) {
      const { error } = await supabase
        .from('order_line_items_v2')
        .update({
          status: dbLi.status,
          restocked: dbLi.restocked,
          refund_status: dbLi.refund_status,
          updated_at: dbLi.updated_at
        })
        .eq('line_item_id', dbLi.line_item_id);
      
      if (error) console.error(`Error updating item ${dbLi.line_item_id}:`, error);
    }
  }

  // 2. Trigger edition re-assignment
  console.log('\n--- Re-triggering Edition Assignment ---');
  const { data: items } = await supabase.from('order_line_items_v2').select('product_id').eq('shopify_customer_id', shopifyId);
  const pids = Array.from(new Set(items.map(i => i.product_id))).filter(Boolean);
  
  for (const pid of pids) {
    await supabase.rpc('assign_edition_numbers', { p_product_id: pid });
  }

  console.log('Deep sync and edition re-assignment complete.');
}

deepSyncDebra();
