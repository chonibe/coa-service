#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applySimplePolicies() {
  console.log('🔧 Applying simplified RLS policies...\n')

  // First create the table with no RLS
  const createTableSQL = `
    DROP TABLE IF EXISTS artwork_slides CASCADE;

    CREATE TABLE artwork_slides (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      display_order INTEGER DEFAULT 0,
      background JSONB NOT NULL DEFAULT '{"type": "gradient", "value": "dark", "scale": 1, "offsetX": 0, "offsetY": 0}',
      elements JSONB DEFAULT '[]',
      title TEXT,
      caption TEXT,
      audio JSONB,
      is_locked BOOLEAN DEFAULT false,
      is_published BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_artwork_slides_product_order
      ON artwork_slides(product_id, display_order);

    ALTER TABLE artwork_slides ENABLE ROW LEVEL SECURITY;
  `

  console.log('📝 Creating table...')
  const { data: createData, error: createError } = await supabase.rpc('exec_sql', { sql_query: createTableSQL })

  if (createError) {
    console.error('❌ Error creating table:', createError)
    return
  }

  console.log('✅ Table created successfully')

  // Now try the simple policies
  const simplePolicies = `
    -- Simple policy for viewing published slides
    CREATE POLICY "Anyone can view published slides"
      ON artwork_slides FOR SELECT
      USING (is_published = true);

    -- Simple policy for vendors (will need to be updated later)
    CREATE POLICY "Vendors can manage their product slides"
      ON artwork_slides FOR ALL
      USING (true);  -- Temporary: allow all authenticated users

    -- Grant permissions
    GRANT SELECT ON artwork_slides TO anon;
    GRANT ALL ON artwork_slides TO authenticated;
  `

  console.log('📝 Applying policies...')
  const { data: policyData, error: policyError } = await supabase.rpc('exec_sql', { sql_query: simplePolicies })

  if (policyError) {
    console.error('❌ Error applying policies:', policyError)
    return
  }

  console.log('✅ Policies applied successfully')

  // Test the table
  console.log('🧪 Testing table...')
  const { data: slides, error: queryError } = await supabase
    .from('artwork_slides')
    .select('*')
    .limit(1)

  if (queryError) {
    console.error('❌ Query error:', queryError)
  } else {
    console.log('✅ Query successful:', slides)
  }
}

applySimplePolicies().catch(console.error)
