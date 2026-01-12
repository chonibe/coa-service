const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function auditMissingEditions() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Missing Edition Audit ---');

  // Find items that SHOULD have editions but don't
  // Rules:
  // 1. Status is 'active'
  // 2. Edition number is NULL
  // 3. Vendor is NOT 'Street Collector'
  // 4. Order is NOT canceled/restocked/refunded/voided
  // 5. Product HAS edition_size (not checked here, but implied for artworks)
  
  const { data: missingEditions } = await supabase
    .from('order_line_items_v2')
    .select('id, name, vendor_name, order_name, orders!inner(fulfillment_status, financial_status)')
    .is('edition_number', null)
    .eq('status', 'active')
    .not('vendor_name', 'ilike', 'Street Collector')
    .not('orders.fulfillment_status', 'in', '(restocked,canceled)')
    .not('orders.financial_status', 'in', '(refunded,voided)');

  console.log(`\nItems that should have editions but don't: ${missingEditions?.length || 0}`);
  if (missingEditions?.length > 0) {
    console.log('Samples:', missingEditions.slice(0, 10));
    
    // Check if these products have edition_size in the products table
    const pIds = [...new Set(missingEditions.map(m => m.product_id).filter(Boolean))];
    if (pIds.length > 0) {
        const { data: products } = await supabase
            .from('products')
            .select('name, edition_size, shopify_id')
            .in('shopify_id', pIds);
        console.log('\nProduct Details for these items:');
        console.log(products);
    }
  }
}

auditMissingEditions();

