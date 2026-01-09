const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function ingestManualOrders() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('🚀 Starting Refined Manual Warehouse Order Ingestion...');

  const { data: wh } = await supabase.from('warehouse_orders').select('*');
  
  // Filter for manual orders (no shopify link)
  const manualWhOrders = wh.filter(w => !w.shopify_order_id);

  console.log(`Found ${manualWhOrders.length} manual warehouse orders.`);

  let ingestedOrders = 0;
  let ingestedItems = 0;

  for (const orphan of manualWhOrders) {
    const manualOrderId = `WH-${orphan.id}`;
    const email = (orphan.ship_email || '').toLowerCase().trim() || null;
    
    const numericPart = orphan.order_id.replace(/\D/g, '');
    let orderNumber = parseInt(numericPart);
    if (isNaN(orderNumber)) {
      orderNumber = 900000 + (parseInt(orphan.id.slice(-4), 16) % 100000);
    } else if (orderNumber < 10000) {
      orderNumber += 900000;
    }

    const { error: orderError } = await supabase
      .from('orders')
      .upsert({
        id: manualOrderId,
        order_number: orderNumber,
        order_name: orphan.order_id,
        processed_at: orphan.created_at,
        financial_status: 'paid',
        fulfillment_status: orphan.status_name?.toLowerCase().trim() || 'fulfilled',
        total_price: 0,
        currency_code: 'USD',
        customer_email: email,
        created_at: orphan.created_at,
        updated_at: new Date().toISOString(),
        raw_shopify_order_data: { 
          source: 'manual_warehouse',
          warehouse_id: orphan.id,
          original_order_id: orphan.order_id 
        },
        source: 'warehouse'
      }, { onConflict: 'id' });

    if (orderError) {
      console.error(`❌ Error ingesting order ${orphan.order_id}:`, orderError.message);
      continue;
    }
    ingestedOrders++;

    // Ingest Line Items from raw_data.info
    const items = orphan.raw_data?.info || [];
    
    // First, delete old manual items for this order to avoid duplicates
    await supabase.from('order_line_items_v2')
      .delete()
      .eq('order_id', manualOrderId)
      .like('line_item_id', 'WH-ITEM-%');

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const lineItemId = `WH-ITEM-${orphan.id}-${item.sku || 'no-sku'}-${i}`;
      
      const { error: itemError } = await supabase
        .from('order_line_items_v2')
        .upsert({
          line_item_id: lineItemId,
          order_id: manualOrderId,
          order_name: orphan.order_id,
          name: item.product_name || 'Manual Warehouse Product',
          description: item.product_name || '',
          sku: item.sku || null,
          quantity: parseInt(item.quantity) || 1,
          price: 0,
          status: 'active',
          owner_email: email,
          owner_name: orphan.ship_name,
          created_at: orphan.created_at,
          updated_at: new Date().toISOString(),
          metadata: { source: 'manual_warehouse' }
        }, { onConflict: 'line_item_id' });

      if (itemError) {
        console.error(`❌ Error ingesting item ${lineItemId}:`, itemError.message);
      } else {
        ingestedItems++;
      }
    }
  }

  console.log('\n--- Refined Ingestion Summary ---');
  console.log(`Manual Orders Processed: ${ingestedOrders}`);
  console.log(`Line Items Created: ${ingestedItems}`);
  console.log('---------------------------');
}

ingestManualOrders();
