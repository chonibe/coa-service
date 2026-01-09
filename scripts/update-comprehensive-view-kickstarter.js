const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function updateView() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  
  if (!urlMatch || !keyMatch) {
    console.error('Could not find Supabase URL or Service Role Key in .env');
    return;
  }
  
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const sql = `
    DROP VIEW IF EXISTS collector_profile_comprehensive CASCADE;
    CREATE VIEW collector_profile_comprehensive AS
    WITH contact_base AS (
      SELECT LOWER(email) as email FROM auth.users WHERE email IS NOT NULL
      UNION
      SELECT LOWER(customer_email) as email FROM orders WHERE customer_email IS NOT NULL
      UNION
      SELECT LOWER(ship_email) as email FROM warehouse_orders WHERE ship_email IS NOT NULL
      UNION
      SELECT LOWER(email) as email FROM crm_customers WHERE email IS NOT NULL
    ),
    unified_orders AS (
      -- Deduplicate orders by name, prioritizing Shopify (numeric/gid) over Manual (WH-)
      SELECT DISTINCT ON (LOWER(REPLACE(order_name, '#', ''))) 
        *
      FROM orders
      ORDER BY LOWER(REPLACE(order_name, '#', '')), 
        CASE 
          WHEN id NOT LIKE 'WH-%' THEN 1 
          ELSE 2 
        END ASC
    )
    SELECT
      -- Primary Identifier
      cb.email as user_email,
      
      -- User Info (if exists)
      u.id as user_id,
      u.created_at as user_created_at,

      -- Collector Profile (if exists)
      cp.id as profile_id,
      cp.first_name,
      cp.last_name,
      cp.email as profile_email,
      cp.phone as profile_phone,
      cp.bio,
      cp.avatar_url,
      cp.is_kickstarter_backer, -- Added this column
      cp.created_at as profile_created_at,
      cp.updated_at as profile_updated_at,

      -- Computed Display Fields
      COALESCE(
        TRIM(cp.first_name || ' ' || cp.last_name),
        (SELECT TRIM(wo.ship_name) FROM warehouse_orders wo WHERE LOWER(wo.ship_email) = cb.email AND wo.ship_name IS NOT NULL ORDER BY wo.created_at DESC LIMIT 1),
        (SELECT TRIM(concat_ws(' ', raw_shopify_order_data->'customer'->>'first_name', raw_shopify_order_data->'customer'->>'last_name')) FROM orders o WHERE LOWER(o.customer_email) = cb.email AND raw_shopify_order_data->'customer' IS NOT NULL ORDER BY o.processed_at DESC LIMIT 1),
        cb.email
      ) as display_name,

      COALESCE(
        cp.phone,
        (SELECT wo.ship_phone FROM warehouse_orders wo WHERE LOWER(wo.ship_email) = cb.email AND wo.ship_phone IS NOT NULL ORDER BY wo.created_at DESC LIMIT 1),
        (SELECT raw_shopify_order_data->'customer'->>'phone' FROM orders o WHERE LOWER(o.customer_email) = cb.email AND raw_shopify_order_data->'customer'->>'phone' IS NOT NULL ORDER BY o.processed_at DESC LIMIT 1)
      ) as display_phone,

      -- Statistics
      (
        SELECT COUNT(oli.id) 
        FROM order_line_items_v2 oli 
        JOIN unified_orders uo ON oli.order_id = uo.id
        WHERE 
          (
            oli.owner_id = u.id 
            OR LOWER(oli.owner_email) = cb.email 
            OR (oli.owner_email IS NULL AND LOWER(uo.customer_email) = cb.email)
          ) 
          AND oli.status = 'active'
          AND oli.edition_number IS NOT NULL
      ) as total_editions,
      
      (
        SELECT COUNT(oli.id) 
        FROM order_line_items_v2 oli 
        JOIN unified_orders uo ON oli.order_id = uo.id
        WHERE 
          (
            oli.owner_id = u.id 
            OR LOWER(oli.owner_email) = cb.email 
            OR (oli.owner_email IS NULL AND LOWER(uo.customer_email) = cb.email)
          ) 
          AND oli.status = 'active' 
          AND oli.edition_number IS NOT NULL
          AND oli.nfc_claimed_at IS NOT NULL
      ) as authenticated_editions,
      
      (SELECT COUNT(uo.id) FROM unified_orders uo WHERE LOWER(uo.customer_email) = cb.email) as total_orders,
      (SELECT COALESCE(SUM(uo.total_price), 0) FROM unified_orders uo WHERE LOWER(uo.customer_email) = cb.email) as total_spent,
      (SELECT MIN(uo.processed_at) FROM unified_orders uo WHERE LOWER(uo.customer_email) = cb.email) as first_purchase_date,
      (SELECT MAX(uo.processed_at) FROM unified_orders uo WHERE LOWER(uo.customer_email) = cb.email) as last_purchase_date,
      (SELECT COUNT(cpc.id) FROM collector_profile_changes cpc WHERE cpc.user_id = u.id) as profile_changes_count,

      -- PII Sources as JSON
      json_build_object(
        'profile', CASE WHEN cp.id IS NOT NULL THEN
          json_build_object(
            'source', 'collector_profile',
            'first_name', cp.first_name,
            'last_name', cp.last_name,
            'email', cp.email,
            'phone', cp.phone,
            'bio', cp.bio,
            'avatar_url', cp.avatar_url,
            'is_kickstarter_backer', cp.is_kickstarter_backer,
            'updated_at', cp.updated_at
          )
        ELSE NULL END,

        'shopify', (
          SELECT
            json_build_object(
              'source', 'shopify_customer',
              'id', o.customer_id,
              'first_name', raw_shopify_order_data->'customer'->>'first_name',
              'last_name', raw_shopify_order_data->'customer'->>'last_name',
              'email', raw_shopify_order_data->'customer'->>'email',
              'phone', raw_shopify_order_data->'customer'->>'phone',
              'address', raw_shopify_order_data->'customer'->'default_address'
            )
          FROM orders o
          WHERE LOWER(o.customer_email) = cb.email AND raw_shopify_order_data->'customer' IS NOT NULL
          ORDER BY o.processed_at DESC
          LIMIT 1
        ),

        'warehouse', (
          SELECT
            json_build_object(
              'source', 'warehouse_order',
              'first_name', wo.ship_name,
              'last_name', NULL,
              'email', wo.ship_email,
              'phone', wo.ship_phone,
              'address', wo.ship_address,
              'tracking_number', wo.tracking_number,
              'status', wo.status,
              'status_name', wo.status_name
            )
          FROM warehouse_orders wo
          WHERE LOWER(wo.ship_email) = cb.email
          ORDER BY wo.created_at DESC
          LIMIT 1
        )
      ) as pii_sources

    FROM contact_base cb
    LEFT JOIN auth.users u ON LOWER(u.email) = cb.email
    LEFT JOIN collector_profiles cp ON cp.user_id = u.id;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Error updating view:', error);
  } else {
    console.log('✅ Successfully updated collector_profile_comprehensive view with Kickstarter data.');
  }
}

updateView().catch(console.error);

