const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testDedupInDepth() {
  const shopifyId = '7871916114147';
  const email = 'hypstudio@gmail.com';
  
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_line_items_v2(*)')
    .or(`customer_id.eq.${shopifyId},customer_email.ilike.${email}`);

  const orderMap = new Map();
  (orders || []).forEach(order => {
    const match = order.order_name?.replace('#', '').match(/^\d+/);
    const cleanName = match ? match[0] : (order.order_name?.toLowerCase() || order.id);
    
    const existing = orderMap.get(cleanName);
    const isManual = order.id.startsWith('WH-');
    
    const isCanceled = ['restocked', 'canceled'].includes(order.fulfillment_status) || 
                       ['refunded', 'voided'].includes(order.financial_status);
    const existingIsCanceled = existing ? 
                       (['restocked', 'canceled'].includes(existing.fulfillment_status) || 
                        ['refunded', 'voided'].includes(existing.financial_status)) : true;

    if (!existing) {
      orderMap.set(cleanName, order);
    } else if (!isCanceled && existingIsCanceled) {
      orderMap.set(cleanName, order);
    } else if (isCanceled === existingIsCanceled) {
      const existingIsManual = existing.id.startsWith('WH-');
      if (existingIsManual && !isManual) {
        orderMap.set(cleanName, order);
      }
    }
  });

  console.log('--- Post-Dedup Line Item Analysis ---');
  let validItems = [];
  Array.from(orderMap.values()).forEach(o => {
    const items = o.order_line_items_v2 || [];
    const filtered = items.filter(li => {
        const isValidOrder = !['restocked', 'canceled'].includes(o.fulfillment_status) && 
                           !['refunded', 'voided'].includes(o.financial_status);
        const isActuallyActive = li.status !== 'inactive' && 
                               li.status !== 'removed' &&
                               li.restocked !== true && 
                               (li.refund_status === 'none' || li.refund_status === null);
        return isActuallyActive && isValidOrder;
    });
    console.log(`Order #${o.order_number} (${o.id}) | Total Items: ${items.length} | Valid: ${filtered.length} | Fulfil: ${o.fulfillment_status}`);
    validItems.push(...filtered);
  });
  console.log('Final Total valid items:', validItems.length);
}

testDedupInDepth();
