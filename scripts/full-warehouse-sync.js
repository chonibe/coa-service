const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

class ChinaDivisionClient {
  constructor(config) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.chinadivision.com',
    }
  }

  async getOrdersInfo(start, end, fetchAllPages = true) {
    const baseUrl = `${this.config.baseUrl}/orders-info`
    const pageSize = 250
    const url = `${baseUrl}?page=1&page_size=${pageSize}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'apikey': this.config.apiKey },
    })

    if (!response.ok) {
      throw new Error(`ChinaDivision API error: ${response.status}`)
    }

    const data = await response.json()
    if (data.code !== 0) throw new Error(data.msg)

    let orders = []
    if (Array.isArray(data.data)) {
      orders = data.data
    } else if (data.data && data.data.order_infos) {
      orders = data.data.order_infos
      const totalPages = data.data.page_count || 1
      if (fetchAllPages && totalPages > 1) {
        for (let page = 2; page <= totalPages; page++) {
          const pUrl = `${baseUrl}?page=${page}&page_size=${pageSize}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
          const pRes = await fetch(pUrl, { method: 'GET', headers: { 'apikey': this.config.apiKey } })
          if (pRes.ok) {
            const pData = await pRes.json()
            if (pData.code === 0 && pData.data?.order_infos) {
              orders = [...orders, ...pData.data.order_infos]
            }
          }
        }
      }
    }
    return orders
  }
}

async function run() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const apiKeyMatch = envContent.match(/CHINADIVISION_API_KEY=["']?(.*?)["']?(\r|\n|$)/);
  
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : "5f91972f8d59ec8039cecfec3adcead5";
  
  const supabase = createClient(url, key);
  const chinaClient = new ChinaDivisionClient({ apiKey });

  console.log('🚀 Starting FULL Historical Warehouse Sync (2022-Present)...');

  let totalSynced = 0;
  const years = [2022, 2023, 2024, 2025, 2026];

  for (const year of years) {
    const periods = [
      { start: `${year}-01-01`, end: `${year}-06-30` },
      { start: `${year}-07-01`, end: `${year}-12-31` }
    ];

    for (const period of periods) {
      if (new Date(period.start) > new Date()) continue;
      
      console.log(`Fetching orders for period: ${period.start} to ${period.end}...`);
      try {
        const orders = await chinaClient.getOrdersInfo(period.start, period.end, true);
        if (!orders || orders.length === 0) {
          console.log('No orders found.');
          continue;
        }

        const dataToUpsert = orders.map(order => ({
          id: order.sys_order_id || order.order_id,
          order_id: order.order_id,
          ship_email: (order.ship_email || '').toLowerCase().trim() || null,
          ship_name: `${order.first_name || ''} ${order.last_name || ''}`.trim() || null,
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
        }));

        const { error: upsertError } = await supabase
          .from('warehouse_orders')
          .upsert(dataToUpsert, { onConflict: 'id' });

        if (upsertError) {
          console.error(`Error upserting batch:`, upsertError);
        } else {
          totalSynced += orders.length;
          console.log(`✅ Synced ${orders.length} orders (Total: ${totalSynced})`);
        }
      } catch (err) {
        console.error(`Failed to fetch for period ${period.start}:`, err.message);
      }
    }
  }
  console.log(`\n🎉 Historical Warehouse Sync complete! Total: ${totalSynced}`);
}

run();
