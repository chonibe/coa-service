
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function checkChoni() {
  const email = 'chonibe@gmail.com';
  console.log(`--- Checking data for ${email} ---`);
  
  const { data: items, error } = await supabase
    .from('order_line_items_v2')
    .select('id, name, img_url, product_id, order_name')
    .ilike('owner_email', email)
    .limit(10);

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Found ${items?.length || 0} line items for Choni.`);
  items?.forEach(item => {
    console.log(`Order ${item.order_name} | Item: ${item.name} | product_id: ${item.product_id} | img_url: ${item.img_url}`);
  });
}

checkChoni();

