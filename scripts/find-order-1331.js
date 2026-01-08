const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);

  if (!urlMatch || !keyMatch) {
    console.error('Missing Supabase URL or Service Key');
    return;
  }

  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

  const searchName = "#1331";
  console.log(`Searching for real Order: ${searchName}...`);

  // Search by order_name or order_number
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, order_number, order_name, customer_email, customer_id, processed_at, fulfillment_status')
    .or(`order_name.eq.${searchName},order_number.eq.1331`)
    .maybeSingle();

  if (error) {
    console.error('Error fetching order:', error);
    return;
  }

  if (!order) {
    console.log(`Order ${searchName} not found in database.`);
    return;
  }

  console.log('\n✅ Real Order Found:');
  console.log(`- Long ID: ${order.id}`);
  console.log(`- Platform ID: ${order.order_name}`);
  console.log(`- Order Number: ${order.order_number}`);
  console.log(`- Customer Email: ${order.customer_email || 'HIDDEN/NOT SET'}`);
  console.log(`- Shopify Customer ID: ${order.customer_id || 'NOT LINKED'}`);
  console.log(`- Processed At: ${order.processed_at}`);
  console.log(`- Fulfillment: ${order.fulfillment_status}`);

  console.log('\nChecking Line Items (v2):');
  const { data: items } = await supabase
    .from('order_line_items_v2')
    .select('name, edition_number, status, owner_email, owner_name, customer_id')
    .eq('order_id', order.id);

  if (!items || items.length === 0) {
    console.log('No v2 line items found for this order.');
  } else {
    items.forEach((item, i) => {
      console.log(`[Item ${i+1}] ${item.name}`);
      console.log(`  - Edition: #${item.edition_number || 'UNASSIGNED'}`);
      console.log(`  - Linked Email: ${item.owner_email || 'NONE'}`);
      console.log(`  - Linked Name: ${item.owner_name || 'NONE'}`);
      console.log(`  - Shopify Cust ID: ${item.customer_id || 'NONE'}`);
    });
  }
}

run();


