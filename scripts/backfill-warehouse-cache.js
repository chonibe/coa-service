const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  let env = '';
  try {
    env = fs.readFileSync('.env', 'utf8');
  } catch (e) {}

  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);

  const supabaseUrl = urlMatch ? urlMatch[1].trim() : "https://ldmppmnpgdxueebkkpid.supabase.co";
  const supabaseKey = keyMatch ? keyMatch[1].trim() : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkbXBwbW5wZ2R4dWVlYmtrcGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTYzMTAyMCwiZXhwIjoyMDU3MjA3MDIwfQ.GYd8MC2vt0Cs7kQb-WBUBZVkJg-hwwuKkRdJr719DTw";
  const cdKey = "5f91972f8d59ec8039cecfec3adcead5";

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Fetching warehouse orders for the last 30 days...');
  
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const url = `https://api.chinadivision.com/orders-info?page=1&page_size=250&start=${startDate}&end=${endDate}`;
  
  const response = await fetch(url, {
    headers: { 'apikey': cdKey }
  });

  const data = await response.json();
  if (data.code !== 0) {
    console.error('Warehouse API error:', data.msg);
    return;
  }

  const orders = data.data.order_infos || [];
  console.log(`Found ${orders.length} orders in warehouse. Syncing to local table...`);

  for (const order of orders) {
    const { error } = await supabase
      .from('warehouse_orders')
      .upsert({
        id: order.sys_order_id || order.order_id,
        order_id: order.order_id,
        ship_email: order.ship_email?.toLowerCase(),
        ship_name: `${order.first_name || ''} ${order.last_name || ''}`.trim(),
        ship_phone: order.ship_phone,
        ship_address: {
          address1: order.ship_address1,
          address2: order.ship_address2,
          city: order.ship_city,
          state: order.ship_state,
          zip: order.ship_zip,
          country: order.ship_country
        },
        tracking_number: order.tracking_number,
        status: order.status,
        status_name: order.status_name,
        raw_data: order,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error(`Error syncing warehouse order ${order.order_id}:`, error);
    }
  }

  console.log('Warehouse cache backfill complete.');
}

run();
