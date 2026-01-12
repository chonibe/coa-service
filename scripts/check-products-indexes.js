const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkIndexes() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'products';" 
  });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Indexes on products table:');
  console.log(JSON.stringify(data, null, 2));
}

checkIndexes();

