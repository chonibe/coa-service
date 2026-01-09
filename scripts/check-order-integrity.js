const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function checkIntegrity() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Order & Collector Integrity Check ---');

  // 1. Fetch all orders and their line items
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, order_name, financial_status, customer_email, line_items:order_line_items_v2(*)');

  if (ordersError) {
    console.error('Error fetching orders:', ordersError);
    return;
  }

  // 2. Fetch all collector profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('collector_profiles')
    .select('email, id');

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return;
  }

  const profileMap = new Map(profiles.map(p => [p.email?.toLowerCase(), p.id]));
  const discrepancies = [];

  for (const order of orders) {
    const email = order.customer_email?.toLowerCase();
    const profileId = profileMap.get(email);
    
    // Check line items
    const activeItems = order.line_items?.filter(li => li.status === 'active') || [];
    const inactiveItems = order.line_items?.filter(li => li.status !== 'active') || [];

    // Discrepancy: Voided order but active line items
    if (order.financial_status === 'voided' && activeItems.length > 0) {
      discrepancies.push({
        orderId: order.id,
        orderName: order.order_name,
        type: 'VOIDED_WITH_ACTIVE_ITEMS',
        details: `${activeItems.length} active items in a voided order.`
      });
    }

    // Discrepancy: Paid order but NO active line items
    if (['paid', 'partially_paid', 'authorized'].includes(order.financial_status) && activeItems.length === 0 && order.line_items?.length > 0) {
      discrepancies.push({
        orderId: order.id,
        orderName: order.order_name,
        type: 'PAID_WITH_NO_ACTIVE_ITEMS',
        details: `Paid order but all ${order.line_items.length} items are inactive.`
      });
    }

    // Discrepancy: Missing CRM profile for order email
    if (email && !profileId) {
      discrepancies.push({
        orderId: order.id,
        orderName: order.order_name,
        type: 'MISSING_CRM_PROFILE',
        details: `Email ${email} has no entry in collector_profiles.`
      });
    }
  }

  console.log(`Total Orders Checked: ${orders.length}`);
  console.log(`Total Discrepancies Found: ${discrepancies.length}`);

  if (discrepancies.length > 0) {
    console.log('\nBreakdown:');
    const types = {};
    discrepancies.forEach(d => {
      types[d.type] = (types[d.type] || 0) + 1;
    });
    console.table(types);

    console.log('\nSample Discrepancies:');
    console.table(discrepancies.slice(0, 10));
    
    console.log('\nWould you like me to fix these automatically?');
  }
}

checkIntegrity();

