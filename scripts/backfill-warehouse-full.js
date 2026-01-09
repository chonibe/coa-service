const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = "https://ldmppmnpgdxueebkkpid.supabase.co";
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const key = keyMatch[1].trim();
  const cdKey = "5f91972f8d59ec8039cecfec3adcead5";

  const supabase = createClient(url, key);

  console.log('Fetching warehouse orders from 2022-10-01 to present...');
  
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = "2022-10-01";

  let page = 1;
  let hasMore = true;
  let totalSynced = 0;

  while (hasMore) {
    console.log(`Fetching page ${page}...`);
    const apiUrl = `https://api.chinadivision.com/orders-info?page=${page}&page_size=250&start=${startDate}&end=${endDate}`;
    
    const response = await fetch(apiUrl, {
        headers: { 'apikey': cdKey }
    });

    const data = await response.json();
    if (data.code !== 0) {
        console.error('Warehouse API error:', data.msg);
        break;
    }

    const orders = data.data.order_infos || [];
    if (orders.length === 0) {
        hasMore = false;
        break;
    }

    console.log(`Found ${orders.length} orders on page ${page}. Syncing...`);

    for (const order of orders) {
        await supabase
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
    }

    totalSynced += orders.length;
    page++;
    
    // Safety break if there are too many pages, but 250 per page should be fine
    if (page > 100) break; 
  }

  console.log(`Warehouse cache backfill complete. Total synced: ${totalSynced}`);
}

run();



