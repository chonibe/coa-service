const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const pid = '8589020922083';
  const { data: items, error: fetchError } = await supabase
    .from('order_line_items_v2')
    .select('name, vendor_name, edition_number, status, fulfillment_status')
    .eq('product_id', pid);

  if (fetchError) {
    console.error('Error fetching items:', fetchError);
    return;
  }

  console.log(`Product ${pid} Line Items:`, items);
}

run();
