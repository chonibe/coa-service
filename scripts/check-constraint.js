const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function checkConstraint() {
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT confrelid::regclass as referenced_table FROM pg_constraint WHERE conrelid = 'order_line_items_v2'::regclass AND conname = 'order_line_items_v2_customer_id_fkey';" 
  });
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

checkConstraint();

