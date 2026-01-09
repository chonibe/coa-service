const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function syncShopifyRemovals() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const shopifyShop = env.match(/SHOPIFY_SHOP=["']?(.*?)["']?(\r|\n|$)/)[1];
  const shopifyToken = env.match(/SHOPIFY_ACCESS_TOKEN=["']?(.*?)["']?(\r|\n|$)/)[1];
  
  const supabase = createClient(url, key);

  console.log('Fetching active orders from database...');
  // Only check orders from the last 60 days to be efficient, or all if needed
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_name, financial_status')
    .gt('processed_at', sixtyDaysAgo.toISOString())
    .not('financial_status', 'eq', 'voided');

  if (error) {
    console.error('Error fetching orders:', error);
    return;
  }

  console.log(`Checking ${orders.length} orders for removals/restocks...`);

  let deactivatedCount = 0;

  for (const dbOrder of orders) {
    try {
      // Fetch current order state from Shopify
      const response = await fetch(
        `https://${shopifyShop}/admin/api/2024-01/orders/${dbOrder.id}.json`,
        {
          headers: {
            "X-Shopify-Access-Token": shopifyToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Order ${dbOrder.order_name} (${dbOrder.id}) not found in Shopify. Deactivating all line items.`);
          await supabase
            .from('order_line_items_v2')
            .update({ status: 'inactive', edition_number: null })
            .eq('order_id', dbOrder.id);
          continue;
        }
        console.error(`Error fetching order ${dbOrder.id} from Shopify: ${response.status}`);
        continue;
      }

      const { order: shopifyOrder } = await response.json();
      
      // 1. Identify restocked items from refunds
      const restockedLineItemIds = new Set();
      if (shopifyOrder.refunds) {
        shopifyOrder.refunds.forEach(refund => {
          refund.refund_line_items.forEach(ri => {
            if (ri.restock === true) {
              restockedLineItemIds.add(ri.line_item_id.toString());
            }
          });
        });
      }

      // 2. Identify items present in our DB but removed from Shopify's line_items
      const { data: dbLineItems } = await supabase
        .from('order_line_items_v2')
        .select('line_item_id, status')
        .eq('order_id', dbOrder.id)
        .eq('status', 'active');

      if (!dbLineItems) continue;

      const shopifyLineItemIds = new Set(shopifyOrder.line_items.map(li => li.id.toString()));

      for (const dbItem of dbLineItems) {
        const isRestocked = restockedLineItemIds.has(dbItem.line_item_id);
        const isRemoved = !shopifyLineItemIds.has(dbItem.line_item_id);

        if (isRestocked || isRemoved) {
          const reason = isRestocked ? 'restocked' : 'removed from order';
          console.log(`Deactivating line item ${dbItem.line_item_id} in order ${dbOrder.order_name} (${reason})`);
          
          await supabase
            .from('order_line_items_v2')
            .update({ 
              status: 'inactive', 
              edition_number: null,
              updated_at: new Date().toISOString()
            })
            .eq('line_item_id', dbItem.line_item_id);
            
          deactivatedCount++;
        }
      }
    } catch (err) {
      console.error(`Failed to process order ${dbOrder.order_name}:`, err.message);
    }
  }

  console.log(`\nSync complete. Deactivated ${deactivatedCount} line items.`);
}

syncShopifyRemovals();

