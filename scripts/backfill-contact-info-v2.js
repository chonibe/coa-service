const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function backfill() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Fixing customer_name in orders table ---');
  
  const sql = `
    -- 1. Enrichment from warehouse_orders by order name (Email recovery)
    UPDATE "public"."orders" o
    SET 
      "customer_email" = COALESCE(NULLIF(o.customer_email, ''), LOWER(wo.ship_email)),
      "customer_name" = COALESCE(NULLIF(o.customer_name, ''), wo.ship_name),
      "customer_phone" = COALESCE(NULLIF(o.customer_phone, ''), wo.ship_phone),
      "shipping_address" = COALESCE(o.shipping_address, wo.ship_address::jsonb)
    FROM warehouse_orders wo
    WHERE (o.customer_email IS NULL OR o.customer_email = '')
    AND (wo.shopify_order_id = o.id OR wo.order_id = o.order_name);

    -- 2. Enrichment from warehouse_orders by email (PII recovery across all orders for a contact)
    -- [Existing logic remains the same]
    UPDATE "public"."orders" o
    SET 
      "customer_name" = COALESCE(
        NULLIF(o.customer_name, ''), 
        (SELECT ship_name FROM warehouse_orders wo WHERE LOWER(wo.ship_email) = LOWER(o.customer_email) AND ship_name IS NOT NULL ORDER BY created_at DESC LIMIT 1)
      ),
      "customer_phone" = COALESCE(
        NULLIF(o.customer_phone, ''), 
        (SELECT ship_phone FROM warehouse_orders wo WHERE LOWER(wo.ship_email) = LOWER(o.customer_email) AND ship_phone IS NOT NULL ORDER BY created_at DESC LIMIT 1)
      ),
      "shipping_address" = COALESCE(
        o.shipping_address, 
        (SELECT ship_address::jsonb FROM warehouse_orders wo WHERE LOWER(wo.ship_email) = LOWER(o.customer_email) AND ship_address IS NOT NULL ORDER BY created_at DESC LIMIT 1)
      )
    WHERE (o.customer_name IS NULL OR o.customer_name = '')
    AND EXISTS (SELECT 1 FROM warehouse_orders wo WHERE LOWER(wo.ship_email) = LOWER(o.customer_email));
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Successfully backfilled contact info in orders table.');
  }
}

backfill();

