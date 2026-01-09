const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function clearInvalidEditions() {
  console.log('🚀 Clearing edition numbers for restocked, canceled, refunded, or voided orders...');

  // Get IDs of line items in invalid orders
  const { data: items, error: fetchError } = await supabase
    .from('order_line_items_v2')
    .select('id, edition_number, orders!inner(order_name, fulfillment_status, financial_status)')
    .not('edition_number', 'is', null)
    .or('fulfillment_status.in.(restocked,canceled),financial_status.in.(refunded,voided)', { foreignTable: 'orders' });

  if (fetchError) {
    console.error('Error fetching items:', fetchError);
    return;
  }

  console.log(`Found ${items.length} items to clear.`);

  if (items.length > 0) {
    const ids = items.map(i => i.id);
    const { error: updateError } = await supabase
      .from('order_line_items_v2')
      .update({ edition_number: null })
      .in('id', ids);

    if (updateError) {
      console.error('Error clearing editions:', updateError);
    } else {
      console.log(`✅ Successfully cleared edition numbers for ${items.length} items.`);
    }
  }

  // Also trigger a re-assignment for all products affected to close the gaps
  const productIds = Array.from(new Set(items.map(i => i.product_id).filter(Boolean)));
  if (productIds.length > 0) {
    console.log(`Re-assigning editions for ${productIds.length} products...`);
    for (const productId of productIds) {
      await supabase.rpc('assign_edition_numbers', { p_product_id: productId });
    }
    console.log('✅ Re-assignment complete.');
  }
}

clearInvalidEditions();

