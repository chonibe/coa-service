const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function cleanupWarehouseItems() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Cleaning up Warehouse-Only Line Items ---');
  
  // 1. Fetch all unique product IDs from items we're about to delete
  const { data: itemsToDelete } = await supabase
    .from('order_line_items_v2')
    .select('product_id')
    .ilike('line_item_id', 'WH-ITEM-%');

  const pidsToResequence = Array.from(new Set(itemsToDelete?.map(i => i.product_id).filter(Boolean) || []));
  console.log(`Found ${itemsToDelete?.length || 0} items to delete affecting ${pidsToResequence.length} products.`);

  // 2. Delete the items
  const { error: deleteError, count } = await supabase
    .from('order_line_items_v2')
    .delete({ count: 'exact' })
    .ilike('line_item_id', 'WH-ITEM-%');

  if (deleteError) {
    console.error('Delete Error:', deleteError);
    return;
  }

  console.log(`Successfully deleted ${count} warehouse-only line items.`);

  // 3. Resequence edition numbers for affected products
  console.log(`Resequencing edition numbers for ${pidsToResequence.length} products...`);
  for (const pid of pidsToResequence) {
    const { error: rpcError } = await supabase.rpc('assign_edition_numbers', { p_product_id: pid });
    if (rpcError) console.error(`Error resequencing product ${pid}:`, rpcError);
  }

  console.log('Cleanup complete.');
}

cleanupWarehouseItems();

