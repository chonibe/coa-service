const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCollector() {
  const shopifyId = '7871916114147';
  
  // 1. Get profile/email
  const { data: profile } = await supabase
    .from('collector_profile_comprehensive')
    .select('user_email, shopify_customer_id, display_name')
    .eq('shopify_customer_id', shopifyId)
    .maybeSingle();
    
  console.log('--- Collector Profile ---');
  console.log('Name:', profile?.display_name);
  console.log('Email:', profile?.user_email);
  console.log('Shopify ID:', shopifyId);

  // 2. Get orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, financial_status, fulfillment_status, order_name, processed_at')
    .eq('customer_id', shopifyId);
    
  console.log('\n--- Orders ---');
  console.log('Count:', orders?.length);
  orders?.sort((a,b) => b.order_number - a.order_number).forEach(o => {
    console.log(`Order #${o.order_number} (${o.order_name}) | Fin: ${o.financial_status} | Ful: ${o.fulfillment_status} | Date: ${o.processed_at}`);
  });

  // 3. Get line items
  const { data: items } = await supabase
    .from('order_line_items_v2')
    .select('id, name, status, edition_number, order_id, restocked, refund_status')
    .eq('shopify_customer_id', shopifyId);

  console.log('\n--- Line Items ---');
  console.log('Count:', items?.length);
  items?.forEach(i => {
    const order = orders?.find(o => o.id === i.order_id);
    console.log(`Item: ${i.name.padEnd(25)} | Ed: #${(i.edition_number || 'N/A').toString().padEnd(3)} | Status: ${i.status.padEnd(10)} | Order: #${(order?.order_number || '????')} | Restocked: ${i.restocked} | Refund: ${i.refund_status}`);
  });
}

checkCollector();
