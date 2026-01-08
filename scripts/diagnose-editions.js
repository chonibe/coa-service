const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function diagnose() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('--- Diagnosis: Editions and Customers ---');

  // 1. Check orders without emails
  const { count: nullEmails, error: err1 } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .is('customer_email', null);
  
  const { count: totalOrders, error: err2 } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  console.log(`Orders missing email: ${nullEmails} / ${totalOrders}`);

  // 2. Check "Street Collector" items in order_line_items_v2
  const { data: streetItems, error: err3 } = await supabase
    .from('order_line_items_v2')
    .select('name, vendor_name, owner_email')
    .ilike('vendor_name', '%Street%')
    .limit(10);
  
  console.log('\nSample "Street Collector" items in v2:');
  console.table(streetItems);

  // 3. Check for items that MIGHT be editions but aren't being counted (e.g. status)
  const { count: inactiveItems } = await supabase
    .from('order_line_items_v2')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'inactive');
  
  console.log(`\nInactive line items in v2: ${inactiveItems}`);

  // 4. Check a specific collector from the user's list (e.g. Jared Leto)
  const letoEmail = 'crash@jaredleto.com';
  const { data: letoView } = await supabase
    .from('collector_profile_comprehensive')
    .select('*')
    .eq('user_email', letoEmail)
    .maybeSingle();
  
  console.log(`\nJared Leto View Stats: Total Orders: ${letoView?.total_orders}, Total Editions: ${letoView?.total_editions}`);

  const { data: letoItems } = await supabase
    .from('order_line_items_v2')
    .select('name, vendor_name, status, owner_email')
    .eq('owner_email', letoEmail);
  
  console.log(`\nJared Leto Items in order_line_items_v2:`);
  console.table(letoItems);
}

diagnose();

