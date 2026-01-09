const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkMissingEmails() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('Fetching orders with missing emails...');
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_name, customer_email, customer_name')
    .or('customer_email.is.null,customer_email.eq.""')
    .limit(20);

  if (error) {
    console.error('Error fetching orders:', error);
    return;
  }

  console.log(`Found ${data.length} orders with missing emails.`);
  data.forEach(o => console.log(`- ID: ${o.id}, Name: ${o.order_name}, Email: "${o.customer_email}", Name: "${o.customer_name}"`));
}

checkMissingEmails();

