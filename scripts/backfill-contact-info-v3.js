const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function backfill() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Fixing orders table (PII recovery) ---');
  
  const sql = `
    -- 1. Recovery from Warehouse Orders by Order ID/Name (Recovers Email, Name, Phone)
    UPDATE "public"."orders" o
    SET 
      "customer_email" = COALESCE(NULLIF(o.customer_email, ''), LOWER(wo.ship_email)),
      "customer_name" = COALESCE(NULLIF(o.customer_name, ''), wo.ship_name),
      "customer_phone" = COALESCE(NULLIF(o.customer_phone, ''), wo.ship_phone),
      "shipping_address" = COALESCE(o.shipping_address, wo.ship_address::jsonb)
    FROM warehouse_orders wo
    WHERE (o.customer_email IS NULL OR o.customer_email = '' OR o.customer_name IS NULL OR o.customer_name = '')
    AND (wo.shopify_order_id = o.id OR wo.order_id = o.order_name);

    -- 2. Improved Shopify extraction for whatever is left (if not redacted)
    UPDATE "public"."orders"
    SET 
      "customer_name" = COALESCE(NULLIF("customer_name", ''), TRIM(COALESCE(
        NULLIF(CONCAT_WS(' ', raw_shopify_order_data::jsonb->'customer'->>'first_name', raw_shopify_order_data::jsonb->'customer'->>'last_name'), ''),
        NULLIF(CONCAT_WS(' ', raw_shopify_order_data::jsonb->'shipping_address'->>'first_name', raw_shopify_order_data::jsonb->'shipping_address'->>'last_name'), ''),
        NULLIF(CONCAT_WS(' ', raw_shopify_order_data::jsonb->'billing_address'->>'first_name', raw_shopify_order_data::jsonb->'billing_address'->>'last_name'), '')
      ))),
      "customer_phone" = COALESCE(NULLIF("customer_phone", ''), COALESCE(
        raw_shopify_order_data::jsonb->'customer'->>'phone',
        raw_shopify_order_data::jsonb->'shipping_address'->>'phone',
        raw_shopify_order_data::jsonb->'billing_address'->>'phone'
      )),
      "shipping_address" = COALESCE(shipping_address, raw_shopify_order_data::jsonb->'shipping_address')
    WHERE "raw_shopify_order_data" IS NOT NULL;

    -- 3. Cross-order PII recovery (if we have a name for an email in ONE order, use it for ALL their orders)
    UPDATE "public"."orders" o
    SET 
      "customer_name" = COALESCE(
        NULLIF(o.customer_name, ''), 
        (SELECT customer_name FROM orders o2 WHERE LOWER(o2.customer_email) = LOWER(o.customer_email) AND customer_name IS NOT NULL AND customer_name != '' LIMIT 1),
        (SELECT ship_name FROM warehouse_orders wo WHERE LOWER(wo.ship_email) = LOWER(o.customer_email) AND ship_name IS NOT NULL AND ship_name != '' LIMIT 1)
      ),
      "customer_phone" = COALESCE(
        NULLIF(o.customer_phone, ''), 
        (SELECT customer_phone FROM orders o2 WHERE LOWER(o2.customer_email) = LOWER(o.customer_email) AND customer_phone IS NOT NULL AND customer_phone != '' LIMIT 1),
        (SELECT ship_phone FROM warehouse_orders wo WHERE LOWER(wo.ship_email) = LOWER(o.customer_email) AND ship_phone IS NOT NULL AND ship_phone != '' LIMIT 1)
      )
    WHERE (o.customer_name IS NULL OR o.customer_name = '')
    AND o.customer_email IS NOT NULL AND o.customer_email != '';
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Successfully recovered PII in orders table.');
  }
}

backfill();

