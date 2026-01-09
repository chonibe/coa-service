const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkOrder1182() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Checking Order #1182 ---');

  // 1. Find the order ID first
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_name, customer_email, financial_status')
    .or('order_name.eq.#1182,order_number.eq.1182')
    .maybeSingle();

  if (orderError) {
    console.error('Error fetching order:', orderError);
    return;
  }

  if (!order) {
    console.log('Order #1182 not found in database.');
    return;
  }

  console.log(`Order Found: ${order.order_name} (ID: ${order.id})`);
  console.log(`Customer Email: ${order.customer_email}`);
  console.log(`Financial Status: ${order.financial_status}`);

  // 1.5 Check warehouse_orders for PII
  console.log('\n--- Checking Warehouse Cache for #1182 ---');
  const { data: whCache } = await supabase
    .from('warehouse_orders')
    .select('ship_email, ship_name, order_id, shopify_order_id')
    .or('order_id.eq.#1182,shopify_order_id.eq.6074556219619');
  
  console.table(whCache);

  // 1.6 Check if we have multiple orders with this name
  const { data: all1182 } = await supabase.from('orders').select('id, order_name, customer_email, source').eq('order_name', '#1182');
  console.log('\n--- All Orders named #1182 ---');
  console.table(all1182);

  // 2. Fetch line items
  const { data: items, error: itemsError } = await supabase
    .from('order_line_items_v2')
    .select('sku, name, edition_number, status, vendor_name')
    .eq('order_id', order.id);

  if (itemsError) {
    console.error('Error fetching line items:', itemsError);
    return;
  }

  console.log(`\nLine Items (${items.length} total):`);
  console.table(items);

  // 0. Check products count
  const { count: pCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  console.log(`Total Products in Table: ${pCount}`);

  // 3. Check products table for these names
  console.log('\n--- Sample Products ---');
  const { data: sampleProducts } = await supabase.from('products').select('name').limit(5);
  console.table(sampleProducts);

  console.log('\n--- Searching Products table (JS Filter) ---');
  const { data: allProducts, error: apError } = await supabase.from('products').select('*');
  if (apError) {
    console.error('Error fetching all products:', apError.message);
  } else {
    console.log(`Fetched ${allProducts?.length || 0} products.`);
    if (allProducts && allProducts.length > 0) {
      console.log('Available columns:', Object.keys(allProducts[0]));
    }
    const matches = allProducts?.filter(p => 
      p.name?.toLowerCase().includes('going') || 
      p.name?.toLowerCase().includes('lamp') ||
      p.name?.toLowerCase().includes('north')
    );
    console.table(matches?.map(m => ({ sku: m.sku || m.product_id, name: m.name })));
  }

  // 5. Final check of the linked order
  console.log('\n--- Final Order Check ---');
  const { data: finalOrder } = await supabase.from('orders').select('customer_email, kickstarter_backing_amount_gbp').eq('id', '6074556219619').single();
  console.log(`Linked Email: ${finalOrder.customer_email}`);
  console.log(`Backing Amount: £${finalOrder.kickstarter_backing_amount_gbp}`);
}

checkOrder1182();

