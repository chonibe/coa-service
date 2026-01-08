const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkCRMConstraints() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'crm_customers';" 
  });
  
  if (error) {
    console.error(error);
  } else {
    console.table(data);
  }
}

checkCRMConstraints();

