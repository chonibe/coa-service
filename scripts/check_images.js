
const { createClient } = require('@supabase/supabase-js');

async function checkData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Checking products table...');
  const { data: products, error: pError } = await supabase
    .from('products')
    .select('name, image_url, img_url')
    .limit(5);

  if (pError) console.error(pError);
  else console.table(products);

  console.log('\nChecking order_line_items_v2 table...');
  const { data: lineItems, error: lError } = await supabase
    .from('order_line_items_v2')
    .select('name, img_url')
    .limit(5);

  if (lError) console.error(lError);
  else console.table(lineItems);
}

checkData();

