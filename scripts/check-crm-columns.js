const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkCRMColumns() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'crm_customers';" 
  });
  
  if (error) {
    console.error(error);
  } else {
    console.table(data);
  }
}

checkCRMColumns();

