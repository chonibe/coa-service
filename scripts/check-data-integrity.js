const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkData() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Order Contact Info Sample ---');
  const { data: orders, error: oError } = await supabase
    .from('orders')
    .select('id, order_name, customer_email, customer_name, customer_phone')
    .limit(10);
  
  if (oError) console.error(oError);
  else console.table(orders);

  console.log('\n--- Comprehensive View Sample (PII Bridge) ---');
  const { data: view, error: vError } = await supabase
    .from('collector_profile_comprehensive')
    .select('user_email, display_name, total_orders, total_editions')
    .limit(20);
  
  if (vError) console.error(vError);
  else console.table(view);

  console.log('\n--- Line Items check for Parker ---');
  const { data: parkerItems } = await supabase.from('order_line_items_v2').select('id, name, edition_number, status, owner_email, order_id').ilike('owner_email', 'parker.gootkin@gmail.com');
  console.log('Parker directly linked items:', parkerItems);
  
  const { data: parkerOrdersStats } = await supabase.from('orders').select('id, financial_status, cancelled_at').in('id', parkerOrders.map(o => o.id));
  console.log('Parker orders stats:', parkerOrdersStats);
}

checkData();
