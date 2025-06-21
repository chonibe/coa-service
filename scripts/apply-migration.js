require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

async function applyMigration() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    console.error('SUPABASE_URL:', supabaseUrl)
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '[REDACTED]' : 'undefined')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // SQL to add and populate customer_id in order_line_items_v2
  const sql = `
    -- Add customer_id column to order_line_items_v2 table if it doesn't exist
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_line_items_v2' 
        AND column_name = 'customer_id'
      ) THEN
        ALTER TABLE "public"."order_line_items_v2" 
        ADD COLUMN "customer_id" UUID REFERENCES auth.users(id);

        -- Create an index for faster lookups
        CREATE INDEX idx_order_line_items_v2_customer_id 
        ON "public"."order_line_items_v2" ("customer_id");

        -- Update policy to ensure users can only see their own line items
        CREATE POLICY "Enable read access for authenticated users on their own line items" 
        ON "public"."order_line_items_v2"
        FOR SELECT
        USING (auth.uid() = customer_id);
      END IF;
    END $$;

    -- Update customer_id in order_line_items_v2 from orders and customers tables
    UPDATE "public"."order_line_items_v2" oli
    SET customer_id = c.id
    FROM "public"."orders" o
    JOIN "public"."customers" c ON c.shopify_customer_id = o.customer_id
    WHERE oli.order_id = o.id;

    -- Create a trigger to keep customer_id in sync
    CREATE OR REPLACE FUNCTION sync_customer_id_from_order()
    RETURNS TRIGGER AS $$
    BEGIN
      UPDATE "public"."order_line_items_v2" oli
      SET customer_id = c.id
      FROM "public"."customers" c
      WHERE c.shopify_customer_id = NEW.customer_id
      AND oli.order_id = NEW.id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS sync_customer_id_on_order_update ON "public"."orders";

    -- Create the trigger
    CREATE TRIGGER sync_customer_id_on_order_update
    AFTER UPDATE OF customer_id ON "public"."orders"
    FOR EACH ROW
    EXECUTE FUNCTION sync_customer_id_from_order();
  `

  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('Migration error:', error)
      process.exit(1)
    }

    console.log('Migration applied successfully')
  } catch (error) {
    console.error('Migration error:', error)
    process.exit(1)
  }
}

applyMigration() 