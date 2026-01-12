const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function auditProtocols() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Edition Protocol Audit ---');

  // 1. Inactive status items with edition numbers
  const { data: inactiveWithEditions } = await supabase
    .from('order_line_items_v2')
    .select('id, name, edition_number, status, order_name')
    .not('edition_number', 'is', null)
    .neq('status', 'active');
  
  console.log(`\n1. Inactive items with edition numbers: ${inactiveWithEditions?.length || 0}`);
  if (inactiveWithEditions?.length > 0) {
    console.log('Samples:', inactiveWithEditions.slice(0, 5));
  }

  // 2. Items in invalid orders with edition numbers
  const { data: invalidOrderItems } = await supabase
    .from('order_line_items_v2')
    .select('id, name, edition_number, order_name, orders!inner(fulfillment_status, financial_status)')
    .not('edition_number', 'is', null)
    .or('orders.fulfillment_status.in.(restocked,canceled),orders.financial_status.in.(refunded,voided)');

  console.log(`\n2. Items in canceled/restocked/refunded orders with edition numbers: ${invalidOrderItems?.length || 0}`);
  if (invalidOrderItems?.length > 0) {
    console.log('Samples:', invalidOrderItems.slice(0, 5));
  }

  // 3. Street Collector items with edition numbers
  const { data: streetCollectorWithEditions } = await supabase
    .from('order_line_items_v2')
    .select('id, name, edition_number, vendor_name, order_name')
    .not('edition_number', 'is', null)
    .ilike('vendor_name', 'Street Collector');

  console.log(`\n3. Street Collector items with edition numbers: ${streetCollectorWithEditions?.length || 0}`);
  if (streetCollectorWithEditions?.length > 0) {
    console.log('Samples:', streetCollectorWithEditions.slice(0, 5));
  }

  // 4. Duplicate edition numbers
  const { data: duplicates, error: dupError } = await supabase
    .rpc('exec_sql', { 
      sql_query: `
        SELECT product_id, edition_number, count(*) 
        FROM order_line_items_v2 
        WHERE edition_number IS NOT NULL 
        GROUP BY product_id, edition_number 
        HAVING count(*) > 1;
      ` 
    });

  console.log(`\n4. Duplicate edition numbers found: ${duplicates?.length || 0}`);
  if (duplicates?.length > 0) {
    console.log('Duplicates:', duplicates);
  }
}

auditProtocols();

