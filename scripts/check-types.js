const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkSchema() {
  const env = fs.readFileSync('.env', 'utf8');
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);

  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

  console.log('Checking column types...');
  
  const { data: cols, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('products', 'order_line_items_v2', 'orders') AND column_name IN ('product_id', 'id', 'order_id')"
  });

  if (error) {
    console.error('Error fetching columns:', error);
    // Try a different way if exec_sql doesn't exist
    return;
  }

  console.log(JSON.stringify(cols, null, 2));
}

checkSchema();

