const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkJsonEnrichment() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('--- Checking for Order -> JSON Enrichment ---');
  
  const { data: orders } = await supabase.from('orders').select('id, raw_shopify_order_data').is('customer_email', null);
  
  let jsonMatches = 0;
  let sampleMatch = null;

  for (const order of orders) {
    const raw = order.raw_shopify_order_data;
    const email = raw?.email || raw?.customer?.email || raw?.contact_email;
    
    if (email) {
      jsonMatches++;
      if (!sampleMatch) sampleMatch = { id: order.id, email };
    }
  }

  console.log(`Orders missing email: ${orders.length}`);
  console.log(`Emails found hidden in raw_shopify_order_data: ${jsonMatches}`);
  
  if (sampleMatch) {
    console.log('\nSample JSON Enrichment:');
    console.log(`Order ID: ${sampleMatch.id}, Found Email: ${sampleMatch.email}`);
  }
}

checkJsonEnrichment();

