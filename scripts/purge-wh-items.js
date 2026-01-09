const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function purgeWarehouseItemsFromShopifyOrders() {
  console.log('🚀 Purging warehouse line items from Shopify orders...');

  // 1. Fetch all items that start with WH-ITEM- and are linked to a Shopify order ID (numeric-ish)
  const { data: items, error: fetchError } = await supabase
    .from('order_line_items_v2')
    .select('id, order_id, line_item_id, name')
    .ilike('line_item_id', 'WH-ITEM-%');

  if (fetchError) {
    console.error('Error fetching items:', fetchError);
    return;
  }

  const itemsToDelete = items.filter(item => !item.order_id.startsWith('WH-'));

  console.log(`Found ${itemsToDelete.length} warehouse items attached to Shopify orders.`);

  if (itemsToDelete.length > 0) {
    const ids = itemsToDelete.map(i => i.id);
    const { error: deleteError } = await supabase
      .from('order_line_items_v2')
      .delete()
      .in('id', ids);

    if (deleteError) {
      console.error('Error deleting items:', deleteError);
    } else {
      console.log(`✅ Successfully deleted ${itemsToDelete.length} redundant warehouse line items.`);
    }
  } else {
    console.log('✅ No redundant warehouse items found.');
  }
}

purgeWarehouseItemsFromShopifyOrders();

