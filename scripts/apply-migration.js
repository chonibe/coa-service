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

  // SQL to add foreign key relationship
  const sql = `
    -- Add foreign key constraint for order_id in order_line_items_v2
    ALTER TABLE "public"."order_line_items_v2"
    ALTER COLUMN order_id TYPE TEXT;

    -- Add foreign key constraint
    ALTER TABLE "public"."order_line_items_v2"
    ADD CONSTRAINT fk_order_line_items_v2_order_id
    FOREIGN KEY (order_id)
    REFERENCES "public"."orders"(id)
    ON DELETE CASCADE;

    -- Add index for better join performance
    CREATE INDEX IF NOT EXISTS idx_order_line_items_v2_order_id 
    ON "public"."order_line_items_v2"(order_id);
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