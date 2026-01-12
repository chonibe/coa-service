const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkApiResponse() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const collectorId = '7933818765539'; // Philip Bittmann Shopify ID
  
  // Mocking the activity API logic
  const { data: profile } = await supabase
    .from('collector_profile_comprehensive')
    .select('*')
    .eq('shopify_customer_id', collectorId)
    .single();

  if (!profile) {
    console.log('Profile not found.');
    return;
  }

  const email = profile.user_email;
  const associatedOrderNames = profile.associated_order_names || [];

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      order_name,
      order_line_items_v2 (
        id,
        name,
        edition_number
      )
    `)
    .or(`customer_id.eq.${collectorId},customer_email.ilike.${email},order_name.in.(${associatedOrderNames.map(n => `"${n}"`).join(',')})`);

  console.log(`Orders found: ${orders?.length || 0}`);
  if (orders && orders.length > 0) {
    orders.forEach(o => {
      console.log(`Order #${o.order_number}:`);
      o.order_line_items_v2.forEach(li => {
        console.log(`  - ${li.name}: Edition #${li.edition_number}`);
      });
    });
  }
}

checkApiResponse();

