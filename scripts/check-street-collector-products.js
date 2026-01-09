const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('products')
    .select('name, vendor_name, product_id')
    .ilike('vendor_name', 'Street Collector');

  if (error) {
    console.error('Error fetching products:', error);
  } else {
    console.log('Street Collector Products:', data);
  }
}

run();
