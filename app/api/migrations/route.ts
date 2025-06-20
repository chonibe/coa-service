import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
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

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('Migration error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 