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

  console.log('Finding a real example of a linked edition...');
  
  // Look for items with owner info or edition numbers
  const { data: examples, error } = await supabase
    .from('order_line_items_v2')
    .select('id, order_id, name, edition_number, status, owner_email, owner_name, nfc_tag_id, created_at')
    .not('edition_number', 'is', null)
    .limit(5);

  if (error) {
    console.error('Error fetching examples:', error);
    return;
  }

  if (!examples || examples.length === 0) {
    console.log('No editions found with numbers assigned yet.');
    return;
  }

  for (const item of examples) {
    console.log('\n--- Real Edition Example ---');
    console.log(`Artwork: ${item.name}`);
    console.log(`Edition: #${item.edition_number}`);
    console.log(`Status: ${item.status}`);
    console.log(`Linked Owner: ${item.owner_name || 'Guest'} (${item.owner_email || 'No email yet'})`);
    console.log(`NFC Tag: ${item.nfc_tag_id || 'Not paired'}`);
    console.log(`Order ID: ${item.order_id}`);
    
    // Fetch order email if owner_email is missing to show the "Hybrid" potential
    if (!item.owner_email) {
      const { data: order } = await supabase
        .from('orders')
        .select('customer_email')
        .eq('id', item.order_id)
        .single();
      
      if (order && order.customer_email) {
        console.log(`[PII Connection] Found email in order table: ${order.customer_email}`);
      }
    }
  }
}

run();

