const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkConstraints() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT conname, contype, pg_get_constraintdef(c.oid) as definition FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'products';" 
  });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Constraints on products table:');
  console.log(JSON.stringify(data, null, 2));
}

checkConstraints();

