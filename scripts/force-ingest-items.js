const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function forceIngestItems() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('🚀 Forcing Line Item Ingestion for Warehouse Orders...');

  const { data: wh } = await supabase.from('warehouse_orders').select('*');
  
  let ingestedItems = 0;
  let errorCount = 0;

  for (const record of wh) {
    const manualOrderId = `WH-${record.id}`;
    const email = (record.ship_email || '').toLowerCase().trim() || null;
    
    const items = record.raw_data?.info || [];
    if (items.length === 0) continue;

    console.log(`Processing ${items.length} items for ${record.order_id}...`);

    for (const item of items) {
      const lineItemId = `WH-ITEM-${record.id}-${item.sku || Math.random().toString(36).slice(2, 7)}`;
      
      const { error: itemError } = await supabase
        .from('order_line_items_v2')
        .upsert({
          line_item_id: lineItemId,
          order_id: manualOrderId,
          order_name: record.order_id,
          name: item.product_name || 'Manual Warehouse Product',
          description: item.product_name || 'Manual Ingestion',
          sku: item.sku || null,
          quantity: parseInt(item.quantity) || 1,
          price: 0.00, // Explicitly 0.00
          status: 'active',
          owner_email: email,
          owner_name: record.ship_name,
          created_at: record.created_at,
          updated_at: new Date().toISOString(),
          metadata: { source: 'manual_warehouse' },
          refund_status: 'none',
          refunded_amount: 0.00,
          restocked: false
        }, { onConflict: 'line_item_id' });

      if (itemError) {
        console.error(`❌ Error for ${lineItemId}:`, itemError.message);
        errorCount++;
      } else {
        ingestedItems++;
      }
    }
  }

  console.log('\n--- Force Ingestion Summary ---');
  console.log(`Line Items Created/Updated: ${ingestedItems}`);
  console.log(`Errors: ${errorCount}`);
  console.log('---------------------------');
}

forceIngestItems();

