const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('order_line_items_v2')
    .select('name, vendor_name, edition_number')
    .ilike('vendor_name', 'Street Collector')
    .limit(10);

  if (error) {
    console.error('Error fetching line items:', error);
  } else {
    console.log('Street Collector Line Items Sample:', data);
  }
}

run();
