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

async function testMigration() {
  console.log('🧪 Testing table creation...\n')
  
  // Just create the table without policies
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
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: createTableSQL })
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  console.log('✅ Table created successfully!')
  console.log('\nNow test a simple query:')
  
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

testMigration().catch(console.error)
