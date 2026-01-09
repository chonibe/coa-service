const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function checkRawData() {
  const { data, error } = await supabase
    .from('warehouse_orders')
    .select('order_id, raw_data')
    .limit(10);

  if (error) {
    console.error(error);
    return;
  }

  data.forEach(order => {
    console.log(`Order: ${order.order_id}`);
    if (order.raw_data?.info) {
      console.log(`- Found info: ${order.raw_data.info.length} items`);
      order.raw_data.info.forEach(item => {
        console.log(`  - SKU: ${item.sku}, Name: ${item.product_name}, Qty: ${item.quantity}`);
      });
    } else {
      console.log('- No info found in raw_data');
      console.log('  Keys in raw_data:', Object.keys(order.raw_data || {}));
    }
    console.log('---');
  });
}

checkRawData();

