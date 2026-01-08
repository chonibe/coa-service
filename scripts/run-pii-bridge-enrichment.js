const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function runEnrichment() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  
  if (!urlMatch || !keyMatch) {
    console.error('Could not find Supabase URL or Service Role Key in .env');
    process.exit(1);
  }
  
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('🚀 Starting PII Bridge Enrichment (Warehouse -> Orders)...');
  
  // 1. Fetch all warehouse records with PII
  const { data: warehouse, error: whError } = await supabase
    .from('warehouse_orders')
    .select('order_id, shopify_order_id, ship_email, ship_name')
    .not('ship_email', 'is', null);
    
  if (whError) {
    console.error('Error fetching warehouse data:', whError);
    process.exit(1);
  }
  
  console.log(`Found ${warehouse.length} warehouse records with PII.`);

  // 2. Fetch orders missing emails
  const { data: orders, error: ordError } = await supabase
    .from('orders')
    .select('id, order_name, customer_email')
    .is('customer_email', null);
    
  if (ordError) {
    console.error('Error fetching orders:', ordError);
    process.exit(1);
  }
  
  console.log(`Found ${orders.length} orders missing customer_email.`);

  let enrichedCount = 0;
  let errorCount = 0;

  // 3. Process matches
  for (const order of orders) {
    // Try matching by order_name (e.g., #1320)
    const match = warehouse.find(w => w.order_id === order.order_name || w.shopify_order_id === order.id);
    
    if (match && match.ship_email) {
      const email = match.ship_email.toLowerCase().trim();
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ customer_email: email })
        .eq('id', order.id);
        
      if (updateError) {
        console.error(`❌ Error updating order ${order.order_name}:`, updateError.message);
        errorCount++;
      } else {
        console.log(`✅ Enriched order ${order.order_name} with email: ${email} (${match.ship_name})`);
        enrichedCount++;
      }
    }
  }

  console.log('\n--- Enrichment Summary ---');
  console.log(`Successfully enriched: ${enrichedCount} orders`);
  console.log(`Errors encountered: ${errorCount}`);
  console.log('---------------------------');
}

runEnrichment();

