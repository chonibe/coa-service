const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = "https://ldmppmnpgdxueebkkpid.supabase.co";
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('Step 1: Fetching all unique products with active line items...');
  const { data: products, error: prodError } = await supabase
    .from('order_line_items_v2')
    .select('product_id')
    .eq('status', 'active');

  if (prodError) {
    console.error('Error fetching products:', prodError);
    return;
  }

  const productIds = [...new Set(products.map(p => p.product_id))];
  console.log(`Found ${productIds.length} products to process.`);

  console.log('\nStep 2: Assigning edition numbers and linking PII for each product...');
  let totalUpdated = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const productId of productIds) {
    process.stdout.write(`Processing product ${productId}... `);
    const { data, error } = await supabase.rpc('assign_edition_numbers', { p_product_id: productId.toString() });
    
    if (error) {
      console.log('❌ ERROR');
      console.error(error.message);
      errorCount++;
    } else {
      console.log(`✅ Success (Updated ${data})`);
      totalUpdated += data;
      successCount++;
    }
  }

  console.log('\n--- Final Summary ---');
  console.log(`Total Products: ${productIds.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total Editions Updated/Linked: ${totalUpdated}`);
}

run();



