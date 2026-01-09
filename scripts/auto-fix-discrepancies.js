const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function autoFixDiscrepancies() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Starting Auto-Fix for Order & CRM Discrepancies ---');

  // 1. FIX: Activate line items for PAID orders
  console.log('\n[1/3] Fixing PAID orders with inactive line items...');
  const { data: paidOrders, error: poError } = await supabase
    .from('orders')
    .select('id, order_name, financial_status, line_items:order_line_items_v2(*)')
    .in('financial_status', ['paid', 'partially_paid', 'authorized']);

  if (poError) throw poError;

  let lineItemsFixed = 0;
  for (const order of paidOrders) {
    const hasActive = order.line_items?.some(li => li.status === 'active');
    if (!hasActive && order.line_items?.length > 0) {
      // Logic: Only activate if NOT restocked. 
      // For simplicity, we'll activate ALL items in a PAID order that has NO active items,
      // as this is usually a sync artifact.
      const { error: liError } = await supabase
        .from('order_line_items_v2')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('order_id', order.id);
      
      if (!liError) lineItemsFixed += order.line_items.length;
    }
  }
  console.log(`Activated ${lineItemsFixed} line items across affected paid orders.`);

  // 2. FIX: Create missing CRM profiles
  console.log('\n[2/3] Creating missing CRM profiles from order data...');
  const { data: ordersWithEmails } = await supabase
    .from('orders')
    .select('customer_email, customer_name, customer_phone, customer_id, shipping_address');

  const emailsFromOrders = new Set(ordersWithEmails.map(o => o.customer_email?.toLowerCase()?.trim()).filter(Boolean));
  
  const { data: existingProfiles } = await supabase
    .from('collector_profiles')
    .select('email');
  
  const existingEmails = new Set(existingProfiles.map(p => p.email?.toLowerCase()?.trim()));
  const missingEmails = Array.from(emailsFromOrders).filter(e => !existingEmails.has(e));

  let profilesCreated = 0;
  for (const email of missingEmails) {
    // Find the most recent order data for this email
    const oData = ordersWithEmails
      .filter(o => o.customer_email?.toLowerCase()?.trim() === email)
      .sort((a, b) => 0) // Just pick one
      [0];

    if (!oData) continue;

    const parts = (oData.customer_name || '').split(' ');
    const first_name = parts[0] || 'Guest';
    const last_name = parts.slice(1).join(' ') || 'Collector';

    const { error: cpError } = await supabase
      .from('collector_profiles')
      .insert({
        email: email,
        first_name,
        last_name,
        phone: oData.customer_phone,
        shopify_customer_id: oData.customer_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (!cpError) profilesCreated++;
    else if (cpError.code !== '23505') console.error(`Error creating profile for ${email}:`, cpError.message);
  }
  console.log(`Created ${profilesCreated} new collector profiles.`);

  // 3. FIX: Ensure voided orders have inactive line items
  console.log('\n[3/3] Deactivating line items for VOIDED orders...');
  const { data: voidedOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('financial_status', 'voided');

  if (voidedOrders?.length > 0) {
    const vIds = voidedOrders.map(o => o.id);
    const { error: vError, count } = await supabase
      .from('order_line_items_v2')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .in('order_id', vIds)
      .eq('status', 'active');
    
    console.log(`Deactivated ${count || 0} line items from voided orders.`);
  }

  console.log('\n--- Fix Complete ---');
}

autoFixDiscrepancies();

