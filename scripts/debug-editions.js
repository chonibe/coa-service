const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugEditions() {
  const email = 'hypstudio@gmail.com';
  console.log(`--- Debugging Editions for: ${email} ---`);

  // 1. Fetch orders and line items exactly like the API does
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, processed_at, order_name, fulfillment_status, financial_status, order_line_items_v2(*)')
    .ilike('customer_email', email);
  
  if (error) return console.error('DB Error:', error);
  console.log('Orders found:', orders?.length);

  const allLineItems = (orders || []).flatMap(o => (o.order_line_items_v2 || []).map(li => ({
    ...li,
    order_processed_at: o.processed_at,
    order_fulfillment_status: o.fulfillment_status,
    order_financial_status: o.financial_status
  })));
  
  console.log('Total line items across orders:', allLineItems.length);

  // 2. Apply the exact filter from app/api/collector/editions/route.ts
  const filtered = allLineItems.filter(li => {
    const isValidOrder = !['restocked', 'canceled'].includes(li.order_fulfillment_status) && 
                       !['refunded', 'voided'].includes(li.order_financial_status);
    
    // The current API logic
    const isActuallyActive = li.status !== 'inactive' && 
                           li.status !== 'removed' &&
                           li.restocked !== true && 
                           (li.refund_status === 'none' || li.refund_status === null);

    const result = isActuallyActive && isValidOrder;
    
    if (!result) {
       console.log(`Filtered out: ${li.name} | Status: ${li.status} | Fulfil: ${li.order_fulfillment_status} | Fin: ${li.order_financial_status} | Restocked: ${li.restocked} | Refund: ${li.refund_status}`);
    } else {
       console.log(`PASSED: ${li.name} | Status: ${li.status} | Ed: ${li.edition_number}`);
    }
    
    return result;
  });

  console.log('Final count of items that would be in Artworks tab:', filtered.length);
}

debugEditions();
