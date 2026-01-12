const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkSchemas() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Table Schema Check ---');

  const { data: oliCols } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'order_line_items_v2';" 
  });
  console.log('order_line_items_v2 columns:', oliCols?.map(c => c.column_name).join(', '));

  const { data: pCols } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'products';" 
  });
  console.log('products columns:', pCols?.map(c => c.column_name).join(', '));

  // Check for missing images in OLI
  const { count } = await supabase
    .from('order_line_items_v2')
    .select('*', { count: 'exact', head: true })
    .is('img_url', null);
  
  console.log(`\nItems with missing img_url in order_line_items_v2: ${count}`);
}

checkSchemas();

