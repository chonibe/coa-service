const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);

  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

  console.log('Querying products table schema...');
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products'" 
  });

  if (error) {
    console.error('Error:', error);
    // Fallback if rpc failed
    const { data: sample } = await supabase.from('products').select('*').limit(1);
    console.log('Sample product:', JSON.stringify(sample, null, 2));
  } else {
    console.log('Products columns:', JSON.stringify(data, null, 2));
  }
  
  console.log('\nQuerying order_line_items_v2 table schema...');
  const { data: v2Data } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'order_line_items_v2'" 
  });
  console.log('V2 columns:', JSON.stringify(v2Data, null, 2));
}

run();

