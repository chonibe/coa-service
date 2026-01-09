const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function findMissingLineItems() {
  console.log('🚀 Checking for manual orders with missing line items...');

  // 1. Fetch all manual orders from warehouse_orders that don't have a shopify_order_id
  const { data: whOrders, error } = await supabase
    .from('warehouse_orders')
    .select('id, order_id, raw_data')
    .is('shopify_order_id', null);

  if (error) {
    console.error('Error fetching warehouse orders:', error);
    return;
  }

  console.log(`Analyzing ${whOrders.length} manual warehouse orders...`);

  let totalMissingItems = 0;
  const ordersToFix = [];

  for (const wo of whOrders) {
    const mainOrderId = `WH-${wo.id}`;
    const expectedItems = wo.raw_data?.info || [];
    
    // 2. Count actual items in v2 table
    const { count, error: countError } = await supabase
      .from('order_line_items_v2')
      .select('id', { count: 'exact', head: true })
      .eq('order_id', mainOrderId);

    if (countError) {
      console.error(`Error counting items for ${mainOrderId}:`, countError);
      continue;
    }

    if (count < expectedItems.length) {
      console.log(`Order ${wo.order_id} (${mainOrderId}): Expected ${expectedItems.length}, Found ${count}`);
      ordersToFix.push({
        wo,
        mainOrderId,
        missing: expectedItems.length - count
      });
      totalMissingItems += (expectedItems.length - count);
    }
  }

  console.log(`\nFound ${ordersToFix.length} orders with missing items (Total missing: ${totalMissingItems})`);
  return ordersToFix;
}

findMissingLineItems().then(async (orders) => {
  if (!orders || orders.length === 0) return;

  console.log('\n🚀 Starting repair process...');
  
  // Pre-fetch product data for SKU matching
  const { data: products } = await supabase
    .from('products')
    .select('sku, product_id, img_url, name');
  
  const productMap = new Map();
  products?.forEach(p => {
    if (p.sku) productMap.set(p.sku.toLowerCase().trim(), p);
  });

  let fixedCount = 0;

  for (const { wo, mainOrderId } of orders) {
    const items = wo.raw_data?.info || [];
    const ownerEmail = wo.raw_data?.ship_email?.toLowerCase();
    const ownerName = wo.raw_data?.ship_name;

    const lineItems = items.map((item) => {
      const match = productMap.get(item.sku?.toLowerCase().trim());
      const itemId = `${mainOrderId}-${item.sku || Math.random().toString(36).substring(7)}`;
      
      return {
        id: itemId,
        order_id: mainOrderId,
        order_name: wo.order_id,
        line_item_id: itemId,
        name: match?.name || item.product_name || item.sku || 'Manual Item',
        description: item.product_name || item.sku || 'Manual Item',
        price: parseFloat(item.price || '0'),
        quantity: parseInt(item.quantity || '1', 10),
        vendor_name: item.supplier || 'Manual',
        fulfillment_status: 'fulfilled',
        status: 'active',
        created_at: wo.raw_data?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_email: ownerEmail,
        owner_name: ownerName,
        sku: item.sku || null,
        product_id: match?.product_id || null,
        img_url: match?.img_url || null,
      };
    });

    if (lineItems.length > 0) {
      const { error: upsertError } = await supabase
        .from('order_line_items_v2')
        .upsert(lineItems, { onConflict: 'line_item_id' });

      if (upsertError) {
        console.error(`❌ Error fixing items for ${mainOrderId}:`, upsertError.message);
      } else {
        console.log(`✅ Fixed ${mainOrderId}`);
        fixedCount++;
      }
    }
  }

  console.log(`\n🎉 Repair complete! Fixed ${fixedCount} orders.`);
});

