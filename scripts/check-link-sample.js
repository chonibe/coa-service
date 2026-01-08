const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = "https://ldmppmnpgdxueebkkpid.supabase.co";
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const key = keyMatch[1].trim();
  const s = createClient(url, key);
  
  const { data: li } = await s.from('order_line_items_v2').select('owner_id, shopify_customer_id').not('owner_id', 'is', null).limit(1);
  console.log('Line Item Owner ID:', li?.[0]?.owner_id);
  console.log('Line Item Shopify ID:', li?.[0]?.shopify_customer_id);

  if (li?.[0]?.owner_id) {
    const { data: cust } = await s.from('customers').select('id, first_name, last_name').eq('id', li[0].owner_id).maybeSingle();
    console.log('Matching Customer by UUID:', cust);
  }

  if (li?.[0]?.shopify_customer_id) {
    const { data: cust } = await s.from('customers').select('id, first_name, last_name').eq('shopify_customer_id', li[0].shopify_customer_id).maybeSingle();
    console.log('Matching Customer by Shopify ID:', cust);
  }
}

run();

