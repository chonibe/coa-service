const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkMissing() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Checking for Orders without Line Items ---');
  
  // Get all orders from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_name, processed_at')
    .gte('processed_at', thirtyDaysAgo.toISOString())
    .not('id', 'like', 'WH-%');

  console.log(`Total orders in last 30 days: ${orders?.length || 0}`);

  const missing = [];
  for (const order of orders || []) {
    const { count } = await supabase
      .from('order_line_items_v2')
      .select('id', { count: 'exact', head: true })
      .eq('order_id', order.id);
    
    if (count === 0) {
      missing.push(order);
    }
  }

  console.log(`Orders missing line items: ${missing.length}`);
  if (missing.length > 0) {
    console.table(missing.slice(0, 10));
  }
}

checkMissing();

