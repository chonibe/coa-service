const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function checkMissingManualOrders() {
  const { data: wh, error: whError } = await supabase
    .from('warehouse_orders')
    .select('id, order_id, ship_email')
    .is('shopify_order_id', null);

  if (whError) {
    console.error(whError);
    return;
  }

  const { data: ord, error: ordError } = await supabase
    .from('orders')
    .select('id, order_name');

  if (ordError) {
    console.error(ordError);
    return;
  }

  const ordIds = new Set(ord.map(o => o.id));
  const ordNames = new Set(ord.map(o => o.order_name));

  const missing = wh.filter(w => {
    if (ordIds.has(`WH-${w.id}`)) return false;
    if (ordNames.has(w.order_id)) return false;
    return true;
  });

  console.log(`Found ${missing.length} missing manual orders.`);
  missing.slice(0, 10).forEach(m => {
    console.log(`- ID: ${m.id}, OrderID: ${m.order_id}, Email: ${m.ship_email}`);
  });
}

checkMissingManualOrders();

