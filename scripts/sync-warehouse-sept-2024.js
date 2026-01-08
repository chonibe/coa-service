const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

class ChinaDivisionClient {
  constructor(config) {
    this.config = { ...config, baseUrl: config.baseUrl || 'https://api.chinadivision.com' };
  }
  async getOrdersInfo(start, end) {
    const url = `${this.config.baseUrl}/orders-info?page=1&page_size=250&start=${start}&end=${end}`;
    const response = await fetch(url, { method: 'GET', headers: { 'apikey': this.config.apiKey } });
    const data = await response.json();
    if (data.code !== 0) throw new Error(data.msg);
    let orders = [];
    if (Array.isArray(data.data)) orders = data.data;
    else if (data.data?.order_infos) {
      orders = data.data.order_infos;
      const pages = data.data.page_count || 1;
      for (let p = 2; p <= pages; p++) {
        const pRes = await fetch(`${this.config.baseUrl}/orders-info?page=${p}&page_size=250&start=${start}&end=${end}`, { headers: { 'apikey': this.config.apiKey } });
        const pData = await pRes.json();
        if (pData.code === 0 && pData.data?.order_infos) orders = [...orders, ...pData.data.order_infos];
      }
    }
    return orders;
  }
}

async function syncWarehouseFromSept2024() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const apiKeyMatch = envContent.match(/CHINADIVISION_API_KEY=["']?(.*?)["']?(\r|\n|$)/);
  
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : "5f91972f8d59ec8039cecfec3adcead5";
  
  const supabase = createClient(url, key);
  const chinaClient = new ChinaDivisionClient({ apiKey });

  console.log('🚀 Syncing warehouse orders from September 2024 onwards...');

  const periods = [
    { start: '2024-09-01', end: '2024-12-31' },
    { start: '2025-01-01', end: '2025-06-30' },
    { start: '2025-07-01', end: '2025-12-31' },
    { start: '2026-01-01', end: '2026-06-30' }
  ];

  let totalSynced = 0;
  for (const period of periods) {
    if (new Date(period.start) > new Date()) continue;
    console.log(`Fetching period ${period.start} to ${period.end}...`);
    try {
      const orders = await chinaClient.getOrdersInfo(period.start, period.end);
      if (orders.length > 0) {
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
        await supabase.from('warehouse_orders').upsert(dataToUpsert, { onConflict: 'id' });
        totalSynced += orders.length;
        console.log(`✅ Synced ${orders.length} orders (Total: ${totalSynced})`);
      }
    } catch (err) {
      console.error(`Error: ${err.message}`);
    }
  }
}

syncWarehouseFromSept2024();

