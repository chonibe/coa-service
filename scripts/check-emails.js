const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkEmails() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const { data: orders } = await supabase.from('orders').select('customer_email');
  const orderEmails = [...new Set(orders.map(o => o.customer_email).filter(Boolean))];
  
  const { data: wh } = await supabase.from('warehouse_orders').select('ship_email');
  const whEmails = [...new Set(wh.map(w => w.ship_email).filter(Boolean).map(e => e.toLowerCase()))];
  
  const allEnrichedEmails = [...new Set([...orderEmails, ...whEmails])];
  
  console.log(`Unique emails in orders: ${orderEmails.length}`);
  console.log(`Unique emails in warehouse: ${whEmails.length}`);
  console.log(`Total unique enriched emails: ${allEnrichedEmails.length}`);
}

checkEmails();

