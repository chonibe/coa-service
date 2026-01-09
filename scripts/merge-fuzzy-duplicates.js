const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function mergeFuzzyDuplicates() {
  console.log('🚀 Starting deep fuzzy duplicate merge (numeric prefix matching)...');

  // 1. Fetch all orders
  const { data: allOrders, error: ordersError } = await supabase
    .from('orders')
    .select('id, order_name, customer_email, customer_id');

  if (ordersError) {
    console.error('Error fetching orders:', ordersError);
    return;
  }

  const manual = allOrders.filter(o => o.id.startsWith('WH-'));
  const shopify = allOrders.filter(o => !o.id.startsWith('WH-'));

  let mergedCount = 0;

  for (const m of manual) {
    // Extract numeric part from manual order name (e.g., 1188A -> 1188)
    const mMatch = m.order_name?.match(/^\d+/);
    if (!mMatch) continue;
    const mNum = mMatch[0];

    // Find best Shopify match
    const shopifyMatch = shopify.find(s => {
      const sMatch = s.order_name?.replace('#', '').match(/^\d+/);
      if (!sMatch) return false;
      return sMatch[0] === mNum;
    });

    if (shopifyMatch) {
      console.log(`\nMerging "${m.order_name}" (${m.id}) into Shopify order "${shopifyMatch.order_name}" (${shopifyMatch.id}):`);

      // 1. Move line items
      const { data: items } = await supabase
        .from('order_line_items_v2')
        .select('id')
        .eq('order_id', m.id);

      if (items && items.length > 0) {
        console.log(`  - Moving ${items.length} items to Shopify order...`);
        await supabase
          .from('order_line_items_v2')
          .update({ 
            order_id: shopifyMatch.id,
            order_name: shopifyMatch.order_name
          })
          .eq('order_id', m.id);
      }

      // 2. Enrich email
      if (!shopifyMatch.customer_email && m.customer_email) {
        console.log(`  - Enriching Shopify email with: ${m.customer_email}`);
        await supabase
          .from('orders')
          .update({ customer_email: m.customer_email })
          .eq('id', shopifyMatch.id);
      }

      // 3. Delete manual order
      const { error: delError } = await supabase.from('orders').delete().eq('id', m.id);
      if (delError) {
        console.error(`  ❌ Error deleting manual order: ${delError.message}`);
      } else {
        console.log(`  ✅ Successfully merged and deleted manual record.`);
        mergedCount++;
      }
    }
  }

  console.log(`\n🎉 Finished! Merged ${mergedCount} fuzzy duplicates.`);
}

mergeFuzzyDuplicates();

