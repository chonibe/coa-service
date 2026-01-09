const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function cleanAndSyncManualOrders() {
  console.log('🚀 Starting clean sync of manual warehouse orders...');

  // 1. Fetch all manual orders from warehouse_orders (no shopify link)
  const { data: whOrders, error: whError } = await supabase
    .from('warehouse_orders')
    .select('*')
    .is('shopify_order_id', null);

  if (whError) return console.error('Error fetching wh orders:', whError);

  console.log(`Found ${whOrders.length} manual warehouse orders.`);

  // 2. Fetch all products for SKU mapping
  const { data: products } = await supabase.from('products').select('sku, product_id, img_url, name, edition_size, vendor_name');
  const productMap = new Map();
  products?.forEach(p => {
    if (p.sku) productMap.set(p.sku.toLowerCase().trim(), p);
  });

  let ordersCreated = 0;
  let itemsSyncedV2 = 0;
  let itemsSyncedLegacy = 0;

  for (const wo of whOrders) {
    const mainOrderId = `WH-${wo.id}`;
    const items = wo.raw_data?.info || [];
    const ownerEmail = wo.ship_email?.toLowerCase() || wo.raw_data?.ship_email?.toLowerCase();
    const ownerName = wo.ship_name || wo.raw_data?.ship_name;

    // A. Ensure the order exists in main table
    const { data: existingOrder } = await supabase.from('orders').select('id').eq('id', mainOrderId).maybeSingle();
    
    if (!existingOrder) {
      console.log(`Creating order ${mainOrderId} (${wo.order_id})...`);
      const isGift = wo.order_id.toLowerCase().startsWith('simply');
      const { error: ordErr } = await supabase.from('orders').insert({
        id: mainOrderId,
        order_number: 900000 + Math.floor(Math.random() * 100000), 
        order_name: wo.order_id,
        processed_at: wo.created_at || new Date().toISOString(),
        financial_status: 'paid',
        fulfillment_status: wo.status_name?.toLowerCase().trim() || 'fulfilled',
        total_price: parseFloat(wo.raw_data?.freight || '0'),
        currency_code: 'USD',
        customer_email: ownerEmail,
        updated_at: new Date().toISOString(),
        raw_shopify_order_data: {
          source: 'manual_warehouse',
          warehouse_id: wo.id,
          original_order_id: wo.order_id,
        },
        created_at: wo.created_at || new Date().toISOString(),
        source: 'warehouse'
      });
      if (ordErr) {
        console.error(`Error creating order ${mainOrderId}:`, ordErr.message);
        continue;
      }
      ordersCreated++;
    }

    // B. DELETE all existing line items for this order to start clean
    await Promise.all([
      supabase.from('order_line_items_v2').delete().eq('order_id', mainOrderId),
      supabase.from('order_line_items').delete().eq('order_id', mainOrderId)
    ]);

    // C. Map and insert all items from raw_data.info
    if (items.length > 0) {
      const v2Items = items.map((item, index) => {
        const cleanSku = item.sku?.toLowerCase().trim();
        const match = productMap.get(cleanSku);
        const lineItemId = `WH-ITEM-${wo.id}-${cleanSku || 'idx' + index}`.toLowerCase();
        
        // Artwork detection: 
        // 1. If it matches a product in our DB, it's potentially an artwork
        // 2. If edition_size exists, it's definitely an artwork
        // 3. Unless the vendor is "Street Collector" and it's not a known artwork
        const isArtwork = match && (match.edition_size || match.vendor_name !== 'Street Collector');
        
        return {
          order_id: mainOrderId,
          order_name: wo.order_id,
          line_item_id: lineItemId,
          name: match?.name || item.product_name || item.sku || 'Manual Item',
          description: item.product_name || item.sku || 'Manual Item',
          price: parseFloat(item.price || '0'),
          quantity: parseInt(item.quantity || '1', 10),
          vendor_name: match?.vendor_name || item.supplier || (match ? 'Sancho' : 'Street Collector'),
          fulfillment_status: wo.status_name?.toLowerCase().trim() || 'fulfilled',
          status: isArtwork ? 'active' : 'inactive', // Non-artworks don't get editions
          created_at: wo.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner_email: ownerEmail,
          owner_name: ownerName,
          sku: item.sku || null,
          product_id: match?.shopify_id || match?.product_id || null, // Prefer shopify_id if available
          img_url: match?.img_url || item.img_url || null,
          edition_total: match?.edition_size ? parseInt(match.edition_size) : null
        };
      });

      const legacyItems = items.map((item, index) => {
        const cleanSku = item.sku?.toLowerCase().trim();
        const match = productMap.get(cleanSku);
        
        return {
          order_id: mainOrderId,
          shopify_line_item_id: `WH-LEGACY-${wo.id}-${index}`,
          title: match?.name || item.product_name || item.sku || 'Manual Item',
          quantity: parseInt(item.quantity || '1', 10),
          price: parseFloat(item.price || '0'),
          sku: item.sku || null,
          vendor: match?.vendor_name || item.supplier || (match ? 'Sancho' : 'Street Collector'),
          fulfillment_status: wo.status_name?.toLowerCase().trim() || 'fulfilled',
          owner_email: ownerEmail,
          owner_name: ownerName,
          created_at: wo.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          image_url: match?.img_url || item.img_url || null,
        };
      });

      const [v2Res, legacyRes] = await Promise.all([
        supabase.from('order_line_items_v2').insert(v2Items),
        supabase.from('order_line_items').insert(legacyItems)
      ]);

      if (v2Res.error) console.error(`Error v2 for ${mainOrderId}:`, v2Res.error.message);
      else itemsSyncedV2 += v2Items.length;

      if (legacyRes.error) console.error(`Error legacy for ${mainOrderId}:`, legacyRes.error.message);
      else itemsSyncedLegacy += legacyItems.length;
    }
  }

  console.log(`\n🎉 Sync complete!`);
  console.log(`- Orders created/verified: ${whOrders.length}`);
  console.log(`- V2 items synced: ${itemsSyncedV2}`);
  console.log(`- Legacy items synced: ${itemsSyncedLegacy}`);
}

cleanAndSyncManualOrders();
