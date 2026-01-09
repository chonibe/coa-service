const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function checkMismatch() {
  const { data: manualOrders, error: moError } = await supabase
    .from('orders')
    .select('id, order_name, order_line_items_v2(id)')
    .like('id', 'WH-%');

  if (moError) {
    console.error(moError);
    return;
  }

  for (const mo of manualOrders) {
    const warehouseId = mo.id.replace('WH-', '');
    const { data: wo, error: woError } = await supabase
      .from('warehouse_orders')
      .select('raw_data')
      .eq('id', warehouseId)
      .maybeSingle();

    if (woError || !wo) continue;

    const rawItemsCount = wo.raw_data?.info?.length || 0;
    const dbItemsCount = mo.order_line_items_v2?.length || 0;

    if (rawItemsCount !== dbItemsCount) {
      console.log(`Order: ${mo.order_name} (${mo.id})`);
      console.log(`- Warehouse items: ${rawItemsCount}`);
      console.log(`- DB items: ${dbItemsCount}`);
      console.log('---');
    }
  }
}

checkMismatch();

