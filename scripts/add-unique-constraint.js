const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function addUniqueConstraint() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  console.log('🏗️ Adding unique constraint to product_id...');
  const { error } = await supabase.rpc('exec_sql', {
    sql_query: "ALTER TABLE products ADD CONSTRAINT unique_product_id UNIQUE (product_id);"
  });

  if (error) {
    console.error('❌ Error adding constraint:', error);
    if (error.message?.includes('already exists')) {
        console.log('✅ Constraint already exists.');
    }
  } else {
    console.log('✅ Unique constraint added to product_id.');
  }
}

addUniqueConstraint();

