const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function ultimateRecovery() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Starting Ultimate PII Recovery ---');
  
  const sql = `
    -- 1. Inverse Recovery: Pull Email/Name from Line Items into Orders
    UPDATE "public"."orders" o
    SET 
      "customer_email" = COALESCE(NULLIF(o.customer_email, ''), LOWER(oli.owner_email)),
      "customer_name" = COALESCE(NULLIF(o.customer_name, ''), oli.owner_name)
    FROM "public"."order_line_items_v2" oli
    WHERE oli.order_id = o.id
    AND (o.customer_email IS NULL OR o.customer_email = '' OR o.customer_name IS NULL OR o.customer_name = '')
    AND (oli.owner_email IS NOT NULL AND oli.owner_email != '');

    -- 2. CID Recovery: Link Orders by Customer ID (if one has email, they all should)
    WITH CID_PII AS (
      SELECT DISTINCT ON (customer_id)
        customer_id,
        customer_email,
        customer_name,
        customer_phone,
        shipping_address
      FROM orders
      WHERE customer_id IS NOT NULL 
      AND customer_email IS NOT NULL AND customer_email != ''
      ORDER BY customer_id, processed_at DESC
    )
    UPDATE "public"."orders" o
    SET 
      "customer_email" = COALESCE(NULLIF(o.customer_email, ''), LOWER(cp.customer_email)),
      "customer_name" = COALESCE(NULLIF(o.customer_name, ''), cp.customer_name),
      "customer_phone" = COALESCE(NULLIF(o.customer_phone, ''), cp.customer_phone),
      "shipping_address" = COALESCE(o.shipping_address, cp.shipping_address)
    FROM CID_PII cp
    WHERE o.customer_id = cp.customer_id
    AND (o.customer_email IS NULL OR o.customer_email = '');

    -- 3. Email-based enrichment from Warehouse (PII recovery across all orders for a contact)
    UPDATE "public"."orders" o
    SET 
      "customer_name" = COALESCE(
        NULLIF(o.customer_name, ''), 
        (SELECT ship_name FROM warehouse_orders wo WHERE LOWER(wo.ship_email) = LOWER(o.customer_email) AND ship_name IS NOT NULL AND ship_name != '' ORDER BY created_at DESC LIMIT 1)
      ),
      "customer_phone" = COALESCE(
        NULLIF(o.customer_phone, ''), 
        (SELECT ship_phone FROM warehouse_orders wo WHERE LOWER(wo.ship_email) = LOWER(o.customer_email) AND ship_phone IS NOT NULL AND ship_phone != '' ORDER BY created_at DESC LIMIT 1)
      )
    WHERE (o.customer_name IS NULL OR o.customer_name = '')
    AND o.customer_email IS NOT NULL AND o.customer_email != '';
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Successfully completed ultimate PII recovery.');
  }
}

ultimateRecovery();

