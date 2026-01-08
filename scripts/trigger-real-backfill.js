const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = "https://ldmppmnpgdxueebkkpid.supabase.co";
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const orderIdToBackfill = "12547767796098"; // Order #1331

  console.log(`Step 1: Finding products in Order #${orderIdToBackfill} (#1331)...`);
  const { data: lineItems, error: lineItemsError } = await supabase
    .from('order_line_items_v2')
    .select('product_id')
    .eq('order_id', orderIdToBackfill);

  if (lineItemsError) {
    console.error("Error fetching line items for order:", lineItemsError);
    return;
  }

  const productIds = [...new Set(lineItems.map(item => item.product_id))];
  console.log(`Found ${productIds.length} unique products: ${productIds.join(', ')}`);

  console.log("\nStep 2: Triggering manual backfill via assign_edition_numbers...");
  for (const productId of productIds) {
    console.log(`Backfilling for product: ${productId}...`);
    const { data, error } = await supabase.rpc('assign_edition_numbers', { p_product_id: productId });
    if (error) {
      console.error(`Error backfilling ${productId}:`, error);
    } else {
      console.log(`Success! Updated ${data} editions for ${productId}.`);
    }
  }

  console.log("\nStep 3: Verifying the results for the order...");
  const { data: updatedLineItems, error: updatedError } = await supabase
    .from('order_line_items_v2')
    .select('name, edition_number, owner_email, owner_name')
    .eq('order_id', orderIdToBackfill);

  if (updatedError) {
    console.error("Error verifying line items:", updatedError);
    return;
  }

  for (const item of updatedLineItems) {
    console.log(`Artwork: ${item.name}`);
    console.log(`Edition: #${item.edition_number || 'UNASSIGNED'}`);
    console.log(`Linked Owner Email: ${item.owner_email || 'FAILED TO LINK'}`);
    console.log(`Linked Owner Name: ${item.owner_name || 'FAILED TO LINK'}`);
    console.log(`---`);
  }
}

run();
