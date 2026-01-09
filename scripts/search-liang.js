const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function searchLiang() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('Searching for "Liang" in various tables...');

  const tables = [
    { name: 'collector_profiles', fields: ['first_name', 'last_name', 'email'] },
    { name: 'orders', fields: ['customer_name', 'customer_email'] },
    { name: 'warehouse_orders', fields: ['ship_name', 'ship_email'] },
    { name: 'order_line_items_v2', fields: ['owner_name', 'owner_email'] }
  ];

  for (const table of tables) {
    console.log(`\nTable: ${table.name}`);
    for (const field of table.fields) {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .ilike(field, '%Liang%')
        .limit(5);

      if (error) {
        console.error(`  Error searching ${table.name}.${field}:`, error.message);
      } else if (data && data.length > 0) {
        console.log(`  Found ${data.length} matches in ${field}:`);
        data.forEach(item => {
          console.log(`    - ${JSON.stringify(item).substring(0, 200)}...`);
        });
      }
    }
  }
}

searchLiang();

