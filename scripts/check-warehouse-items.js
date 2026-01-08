const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkWarehouseItems() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('--- Checking for "Street Collector" and "Box" in Warehouse Orders ---');

  const { data: wh } = await supabase.from('warehouse_orders').select('raw_data');
  
  const allItems = wh.flatMap(d => d.raw_data?.info || []);
  
  const boxes = allItems.filter(i => 
    (i.product_name && i.product_name.toLowerCase().includes('box')) || 
    (i.sku && i.sku.toLowerCase().includes('box'))
  );

  const streetCollectorItems = allItems.filter(i => 
    (i.supplier && i.supplier.toLowerCase().includes('street')) ||
    (i.sku && i.sku.toLowerCase().includes('street'))
  );

  console.log(`Total unique items found in warehouse: ${allItems.length}`);
  console.log(`Items with "box" in name/sku: ${boxes.length}`);
  if (boxes.length > 0) console.table(boxes.slice(0, 10));

  console.log(`Items with "street" in supplier/sku: ${streetCollectorItems.length}`);
  if (streetCollectorItems.length > 0) console.table(streetCollectorItems.slice(0, 10));

  // Check unique suppliers
  const suppliers = [...new Set(allItems.map(i => i.supplier).filter(Boolean))];
  console.log(`\nUnique suppliers in warehouse:`);
  console.log(suppliers);
}

checkWarehouseItems();

