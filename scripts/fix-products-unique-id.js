const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixProductsTable() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  console.log('🔍 Checking for duplicate product_ids...');
  const { data: duplicates } = await supabase.rpc('exec_sql', {
    sql_query: "SELECT product_id, COUNT(*) FROM products GROUP BY product_id HAVING COUNT(*) > 1;"
  });

  if (duplicates && duplicates.length > 0) {
    console.log('⚠️ Found duplicates, cleaning up...');
    for (const dup of duplicates) {
      if (!dup.product_id) continue;
      // Keep the most recently updated one
      await supabase.rpc('exec_sql', {
        sql_query: `DELETE FROM products WHERE id IN (SELECT id FROM products WHERE product_id = ${dup.product_id} ORDER BY updated_at DESC OFFSET 1);`
      });
    }
  }

  console.log('🏗️ Adding unique index to product_id...');
  const { error } = await supabase.rpc('exec_sql', {
    sql_query: "CREATE UNIQUE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id);"
  });

  if (error) {
    console.error('❌ Error adding index:', error);
  } else {
    console.log('✅ Unique index added to product_id.');
  }
}

fixProductsTable();

