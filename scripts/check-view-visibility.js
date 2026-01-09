const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkViewVisibility() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const testEmails = [
    'choni@thestreetlamp.com',
    'mayaizart@gmail.com',
    'birgit-alvarez@gmx.de',
    'bittmannroma@gmail.com'
  ];

  console.log('Checking visibility in collector_profile_comprehensive...');
  for (const email of testEmails) {
    const { data, error } = await supabase
      .from('collector_profile_comprehensive')
      .select('user_email, display_name, total_orders, total_spent')
      .eq('user_email', email)
      .maybeSingle();

    if (error) {
      console.error(`  Error checking ${email}:`, error.message);
    } else if (data) {
      console.log(`  Visible: ${email} -> Name: "${data.display_name}", Orders: ${data.total_orders}, Spent: ${data.total_spent}`);
    } else {
      console.log(`  NOT VISIBLE: ${email}`);
      
      // If not visible, check why. Is it in contact_base?
      // contact_base is built from auth.users, orders, warehouse_orders, crm_customers.
      const { data: orderData } = await supabase.from('orders').select('id, customer_email').eq('customer_email', email);
      console.log(`    - Orders in DB with this email: ${orderData?.length || 0}`);
    }
  }

  // Check total count in view
  const { count, error: countError } = await supabase
    .from('collector_profile_comprehensive')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\nTotal collectors in comprehensive view: ${count}`);
}

checkViewVisibility();

