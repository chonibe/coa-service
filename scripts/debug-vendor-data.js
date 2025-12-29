const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkVendorData() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const vendorPattern = '%Carsten%';
  
  const { data, error } = await supabase
    .from('order_line_items_v2')
    .select('id, created_at, fulfillment_status')
    .ilike('vendor_name', vendorPattern);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  const uncounted = data.filter(item => item.fulfillment_status !== 'fulfilled');
  
  console.log(`\nUncounted Items Dates:`);
  uncounted.forEach(item => {
    console.log(`  - ID: ${item.id}, Date: ${item.created_at}`);
  });
}

checkVendorData();
