const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);

  if (!urlMatch || !keyMatch) {
    console.error('Missing Supabase URL or Service Key in .env');
    return;
  }

  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

  const orderId = "12182601859458";
  
  console.log(`Step 1: Finding products in Order #${orderId}...`);
  const { data: items } = await supabase
    .from('order_line_items_v2')
    .select('product_id, name, owner_email')
    .eq('order_id', orderId);

  if (!items || items.length === 0) {
    console.error('Order not found in line items table.');
    return;
  }

  const productIds = [...new Set(items.map(i => i.product_id))];
  console.log(`Found ${productIds.length} unique products: ${productIds.join(', ')}`);

  console.log('\nStep 2: Triggering manual backfill via assign_edition_numbers...');
  for (const productId of productIds) {
    console.log(`Backfilling for product: ${productId}...`);
    const { data, error } = await supabase.rpc('assign_edition_numbers', { p_product_id: productId });
    if (error) {
      console.error(`Error backfilling ${productId}:`, error);
    } else {
      console.log(`Success! Updated ${data} editions for ${productId}.`);
    }
  }

  console.log('\nStep 3: Verifying the results for the order...');
  const { data: updatedItems } = await supabase
    .from('order_line_items_v2')
    .select('name, edition_number, owner_email')
    .eq('order_id', orderId);

  updatedItems.forEach(item => {
    console.log(`Artwork: ${item.name}`);
    console.log(`Edition: #${item.edition_number}`);
    console.log(`Linked Owner Email: ${item.owner_email || 'FAILED TO LINK'}`);
    console.log('---');
  });
}

run();

