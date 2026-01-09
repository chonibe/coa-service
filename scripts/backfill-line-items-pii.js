const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function backfillLineItems() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Fixing line items (PII and Status) ---');
  
  const sql = `
    -- 1. Backfill owner_email and owner_name from orders table
    UPDATE "public"."order_line_items_v2" oli
    SET 
      owner_email = LOWER(o.customer_email),
      owner_name = o.customer_name
    FROM "public"."orders" o
    WHERE oli.order_id = o.id
    AND (oli.owner_email IS NULL OR oli.owner_name IS NULL);

    -- 2. Activate line items for paid orders that are currently inactive
    -- (But don't activate if they were explicitly restocked or cancelled)
    UPDATE "public"."order_line_items_v2" oli
    SET status = 'active'
    FROM "public"."orders" o
    WHERE oli.order_id = o.id
    AND oli.status = 'inactive'
    AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
    AND o.cancelled_at IS NULL
    AND (oli.restocked IS NULL OR oli.restocked = false);

    -- 3. Get list of unique product_ids to reassign editions
    -- (We will do this in JS to call the RPC per product)
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('Error in SQL backfill:', error);
    return;
  }
  console.log('✅ Successfully backfilled line item PII and activated paid items.');

  console.log('--- Reassigning Edition Numbers ---');
  const { data: products, error: pError } = await supabase
    .from('order_line_items_v2')
    .select('product_id')
    .eq('status', 'active');
  
  if (pError) {
    console.error('Error fetching products:', pError);
    return;
  }

  const uniqueProductIds = [...new Set(products.map(p => p.product_id))];
  console.log(`Found ${uniqueProductIds.length} unique products to process.`);

  for (const productId of uniqueProductIds) {
    if (!productId) continue;
    const { data: count, error: rpcError } = await supabase.rpc('assign_edition_numbers', { p_product_id: productId });
    if (rpcError) {
      console.error(`Error for product ${productId}:`, rpcError);
    } else {
      console.log(`Processed product ${productId}: ${count} editions assigned.`);
    }
  }

  console.log('✅ All edition numbers reassigned.');
}

backfillLineItems();

