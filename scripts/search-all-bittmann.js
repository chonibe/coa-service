const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function searchAllBittmann() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('Searching for ANY mention of "bittmann" in DB...');

  const tables = [
    { name: 'orders', fields: ['customer_name', 'customer_email', 'raw_shopify_order_data::text'] },
    { name: 'order_line_items_v2', fields: ['owner_name', 'owner_email', 'name'] },
    { name: 'warehouse_orders', fields: ['ship_name', 'ship_email', 'raw_data::text'] },
    { name: 'collector_profiles', fields: ['first_name', 'last_name', 'email'] }
  ];

  for (const table of tables) {
    console.log(`\nTable: ${table.name}`);
    for (const field of table.fields) {
      const isJson = field.includes('::text');
      const actualField = isJson ? field.split('::')[0] : field;
      
      let query = supabase.from(table.name).select('*');
      
      if (isJson) {
        // Simple string search in JSONB is hard via postgrest, but let's try a workaround
        // Or just search by the other fields first.
        continue;
      } else {
        query = query.ilike(field, '%bittmann%');
      }

      const { data, error } = await query.limit(10);

      if (error) {
        console.error(`  Error in ${field}:`, error.message);
      } else if (data && data.length > 0) {
        console.log(`  Found ${data.length} matches in ${field}:`);
        data.forEach(d => {
           if (table.name === 'orders') console.log(`    - Order: ${d.order_name}, Email: ${d.customer_email}, Name: ${d.customer_name}`);
           if (table.name === 'order_line_items_v2') console.log(`    - Order: ${d.order_name}, ID: ${d.line_item_id}, Name: ${d.name}`);
           if (table.name === 'collector_profiles') console.log(`    - Profile: ${d.first_name} ${d.last_name}, Email: ${d.email}`);
        });
      }
    }
  }
}

searchAllBittmann();

